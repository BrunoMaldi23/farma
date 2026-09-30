import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type {
  cancelSaleSchema,
  checkoutSchema,
  issueTaxDocumentSchema,
  salesQuerySchema,
} from "./sales.schemas.js";

type CheckoutInput = z.infer<typeof checkoutSchema>;
type SalesQuery = z.infer<typeof salesQuerySchema>;
type CancelSaleInput = z.infer<typeof cancelSaleSchema>;
type IssueTaxDocumentInput = z.infer<typeof issueTaxDocumentSchema>;

const roundMoney = (value: number) => Math.round(value);
const asNumber = (value: unknown) => Number(value ?? 0);

const saleInclude = {
  seller: {
    select: { id: true, firstName: true, lastName: true, username: true },
  },
  patient: true,
  cashSession: {
    include: { cashRegister: true },
  },
  items: {
    include: {
      product: true,
      prescriptionItem: true,
      batchAllocations: {
        include: { batch: true },
      },
    },
  },
  payments: true,
  taxDocument: true,
  coverages: true,
} as const;

type FefoAllocation = {
  batchId: string;
  locationId: string;
  quantity: number;
  unitCost: number | null;
};

const allocateFefo = async (
  tx: any,
  productId: string,
  quantity: number,
  locationId?: string | null,
): Promise<FefoAllocation[]> => {
  const stocks = await tx.inventoryStock.findMany({
    where: {
      ...(locationId ? { locationId } : {}),
      quantity: { gt: 0 },
      location: { isActive: true },
      batch: {
        productId,
        isBlocked: false,
        expirationDate: { gt: new Date() },
      },
    },
    include: {
      batch: true,
    },
    orderBy: {
      batch: {
        expirationDate: "asc",
      },
    },
  });

  let remaining = quantity;
  const allocations: FefoAllocation[] = [];

  for (const stock of stocks) {
    if (remaining <= 0) break;

    const available = Math.max(
      0,
      Number(stock.quantity) - Number(stock.reservedQuantity),
    );

    if (available <= 0) continue;

    const allocated = Math.min(available, remaining);

    allocations.push({
      batchId: stock.batchId,
      locationId: stock.locationId,
      quantity: allocated,
      unitCost:
        stock.batch.purchasePrice === null
          ? null
          : Number(stock.batch.purchasePrice),
    });

    remaining -= allocated;
  }

  if (remaining > 0) {
    throw new ApiError(409, "Stock disponible insuficiente para completar la venta");
  }

  return allocations;
};

export const listSales = async (query: SalesQuery) => {
  const { page, limit, search, status, sellerId, patientId, cashSessionId, from, to } =
    query;
  const { skip, take } = getPagination(page, limit);

  const where = {
    ...(status ? { status } : {}),
    ...(sellerId ? { sellerId } : {}),
    ...(patientId ? { patientId } : {}),
    ...(cashSessionId ? { cashSessionId } : {}),
    ...(from || to
      ? {
          saleDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { customerRut: { contains: search, mode: "insensitive" as const } },
            { customerName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.sale.findMany({
      where,
      include: saleInclude,
      skip,
      take,
      orderBy: { saleDate: "desc" },
    }),
    prisma.sale.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getSale = async (id: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: saleInclude,
  });

  if (!sale) throw new ApiError(404, "Venta no encontrada");
  return sale;
};

export const checkout = async (sellerId: string, input: CheckoutInput) => {
  const session = await prisma.cashSession.findUnique({
    where: { id: input.cashSessionId },
  });

  if (!session || session.status !== "OPEN") {
    throw new ApiError(409, "Debe existir una sesiÃ³n de caja abierta");
  }

  if (input.patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
    });

    if (!patient || !patient.isActive) {
      throw new ApiError(400, "Paciente inexistente o inactivo");
    }
  }

  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    throw new ApiError(400, "Uno o mÃ¡s productos no existen o estÃ¡n inactivos");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  type PreparedSaleItem = {
    productId: string;
    quantity: number;
    discountAmount: number;
    prescriptionItemId?: string | null;
    locationId?: string | null;
    product: {
      id: string;
      name: string;
      salePrice: unknown;
      requiresPrescription: boolean;
    };
    unitPrice: number;
    lineGross: number;
    lineNet: number;
    lineTax: number;
    lineTotal: number;
  };

  const preparedItems: PreparedSaleItem[] = [];

  let subtotal = 0;
  let discountAmount = 0;
  let totalAmount = 0;

  for (const item of input.items) {
    const product = productMap.get(item.productId)!;

    if (product.requiresPrescription && !item.prescriptionItemId) {
      throw new ApiError(
        400,
        `${product.name} requiere una receta vÃ¡lida`,
      );
    }

    if (item.prescriptionItemId) {
      const prescriptionItem = await prisma.prescriptionItem.findUnique({
        where: { id: item.prescriptionItemId },
        include: { prescription: true },
      });

      if (!prescriptionItem || prescriptionItem.productId !== product.id) {
        throw new ApiError(400, "El Ã­tem de receta no corresponde al producto");
      }

      if (
        prescriptionItem.prescription.status !== "ACTIVE" &&
        prescriptionItem.prescription.status !== "PARTIALLY_DISPENSED"
      ) {
        throw new ApiError(409, "La receta no se encuentra disponible para dispensaciÃ³n");
      }

      if (
        prescriptionItem.prescription.expirationDate &&
        prescriptionItem.prescription.expirationDate <= new Date()
      ) {
        throw new ApiError(409, "La receta estÃ¡ vencida");
      }

      if (prescriptionItem.remainingQuantity < item.quantity) {
        throw new ApiError(409, "La receta no tiene saldo suficiente");
      }
    }

    const unitPrice = asNumber(product.salePrice);
    const lineGross = roundMoney(unitPrice * item.quantity);

    if (item.discountAmount > lineGross) {
      throw new ApiError(400, `El descuento de ${product.name} supera el total de la lÃ­nea`);
    }

    const lineTotal = roundMoney(lineGross - item.discountAmount);
    const divisor = 1 + input.taxRate / 100;
    const lineNet = roundMoney(lineTotal / divisor);
    const lineTax = roundMoney(lineTotal - lineNet);

    subtotal += lineGross;
    discountAmount += item.discountAmount;
    totalAmount += lineTotal;

    preparedItems.push({
      ...item,
      product,
      unitPrice,
      lineGross,
      lineNet,
      lineTax,
      lineTotal,
    });
  }

  subtotal = roundMoney(subtotal);
  discountAmount = roundMoney(discountAmount);
  totalAmount = roundMoney(totalAmount);

  const netAmount = roundMoney(totalAmount / (1 + input.taxRate / 100));
  const taxAmount = roundMoney(totalAmount - netAmount);

  const paymentsTotal = roundMoney(
    input.payments.reduce((sum, payment) => sum + payment.amount, 0),
  );

  if (paymentsTotal !== totalAmount) {
    throw new ApiError(
      400,
      `Los pagos (${paymentsTotal}) deben coincidir con el total de la venta (${totalAmount})`,
    );
  }

  if (
    input.taxDocumentType === "INVOICE" &&
    (!input.customerRut ||
      !input.customerBusinessName ||
      !input.customerBusinessActivity ||
      !input.customerAddress)
  ) {
    throw new ApiError(
      400,
      "Para factura se requieren RUT, razÃ³n social, giro y direcciÃ³n",
    );
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        code: input.code,
        status: "DRAFT",
        sellerId,
        patientId: input.patientId ?? null,
        cashSessionId: input.cashSessionId,
        customerRut: input.customerRut ?? null,
        customerName: input.customerName ?? null,
        customerBusinessName: input.customerBusinessName ?? null,
        customerBusinessActivity: input.customerBusinessActivity ?? null,
        customerAddress: input.customerAddress ?? null,
        subtotal,
        discountAmount,
        coverageAmount: 0,
        netAmount,
        taxAmount,
        totalAmount,
        notes: input.notes ?? null,
      },
    });

    for (const item of preparedItems) {
      const allocations = await allocateFefo(
        tx,
        item.productId,
        item.quantity,
        item.locationId,
      );

      const saleItem = await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          prescriptionItemId: item.prescriptionItemId ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          netAmount: item.lineNet,
          taxAmount: item.lineTax,
          totalAmount: item.lineTotal,
        },
      });

      const batchTotals = new Map<string, number>();

      for (const allocation of allocations) {
        await tx.inventoryStock.update({
          where: {
            batchId_locationId: {
              batchId: allocation.batchId,
              locationId: allocation.locationId,
            },
          },
          data: {
            quantity: { decrement: allocation.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            type: "SALE",
            productId: item.productId,
            batchId: allocation.batchId,
            originLocationId: allocation.locationId,
            quantity: allocation.quantity,
            unitCost: allocation.unitCost,
            referenceType: "SALE",
            referenceId: sale.id,
            reason: `Venta ${input.code}`,
            userId: sellerId,
          },
        });

        batchTotals.set(
          allocation.batchId,
          (batchTotals.get(allocation.batchId) ?? 0) + allocation.quantity,
        );
      }

      for (const [batchId, quantity] of batchTotals.entries()) {
        await tx.saleItemBatch.create({
          data: {
            saleItemId: saleItem.id,
            batchId,
            quantity,
          },
        });
      }

      if (item.prescriptionItemId) {
        const prescriptionItem = await tx.prescriptionItem.update({
          where: { id: item.prescriptionItemId },
          data: {
            dispensedQuantity: { increment: item.quantity },
            remainingQuantity: { decrement: item.quantity },
          },
        });

        const prescriptionItems = await tx.prescriptionItem.findMany({
          where: { prescriptionId: prescriptionItem.prescriptionId },
        });

        const allDispensed = prescriptionItems.every(
          (rxItem) => rxItem.remainingQuantity <= 0,
        );
        const anyDispensed = prescriptionItems.some(
          (rxItem) => rxItem.dispensedQuantity > 0,
        );

        await tx.prescription.update({
          where: { id: prescriptionItem.prescriptionId },
          data: {
            status: allDispensed
              ? "DISPENSED"
              : anyDispensed
                ? "PARTIALLY_DISPENSED"
                : "ACTIVE",
          },
        });
      }
    }

    for (const payment of input.payments) {
      await tx.payment.create({
        data: {
          saleId: sale.id,
          method: payment.method,
          amount: payment.amount,
          referenceCode: payment.referenceCode ?? null,
        },
      });
    }

    const cashPaid = roundMoney(
      input.payments
        .filter((payment) => payment.method === "CASH")
        .reduce((sum, payment) => sum + payment.amount, 0),
    );

    if (cashPaid > 0) {
      await tx.cashMovement.create({
        data: {
          cashSessionId: input.cashSessionId,
          type: "SALE",
          amount: cashPaid,
          description: `Venta ${input.code}`,
          saleId: sale.id,
          userId: sellerId,
        },
      });
    }

    await tx.taxDocument.create({
      data: {
        saleId: sale.id,
        type: input.taxDocumentType,
        status: "PENDING",
      },
    });

    await tx.sale.update({
      where: { id: sale.id },
      data: { status: "COMPLETED" },
    });

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: saleInclude,
    });
  });
};

export const cancelSale = async (
  saleId: string,
  userId: string,
  input: CancelSaleInput,
) => {
  const sale = await getSale(saleId);

  if (sale.status !== "COMPLETED") {
    throw new ApiError(409, "Solo se pueden anular ventas completadas");
  }

  return prisma.$transaction(async (tx) => {
    const saleMovements = await tx.inventoryMovement.findMany({
      where: {
        type: "SALE",
        referenceType: "SALE",
        referenceId: saleId,
      },
    });

    for (const movement of saleMovements) {
      if (!movement.originLocationId) continue;

      await tx.inventoryStock.upsert({
        where: {
          batchId_locationId: {
            batchId: movement.batchId,
            locationId: movement.originLocationId,
          },
        },
        update: {
          quantity: { increment: movement.quantity },
        },
        create: {
          batchId: movement.batchId,
          locationId: movement.originLocationId,
          quantity: movement.quantity,
          reservedQuantity: 0,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          type: "CUSTOMER_RETURN",
          productId: movement.productId,
          batchId: movement.batchId,
          destinationLocationId: movement.originLocationId,
          quantity: movement.quantity,
          unitCost: movement.unitCost,
          referenceType: "SALE_CANCELLATION",
          referenceId: saleId,
          reason: input.reason,
          userId,
        },
      });
    }

    for (const item of sale.items) {
      if (!item.prescriptionItemId) continue;

      await tx.prescriptionItem.update({
        where: { id: item.prescriptionItemId },
        data: {
          dispensedQuantity: { decrement: item.quantity },
          remainingQuantity: { increment: item.quantity },
        },
      });
    }

    const prescriptionIds = [
      ...new Set(
        sale.items
          .map((item) => item.prescriptionItem?.prescriptionId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    for (const prescriptionId of prescriptionIds) {
      const items = await tx.prescriptionItem.findMany({
        where: { prescriptionId },
      });

      const allDispensed = items.every((item) => item.remainingQuantity <= 0);
      const anyDispensed = items.some((item) => item.dispensedQuantity > 0);

      await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: allDispensed
            ? "DISPENSED"
            : anyDispensed
              ? "PARTIALLY_DISPENSED"
              : "ACTIVE",
        },
      });
    }

    const cashPaid = roundMoney(
      sale.payments
        .filter((payment) => payment.method === "CASH")
        .reduce((sum, payment) => sum + asNumber(payment.amount), 0),
    );

    if (cashPaid > 0 && sale.cashSessionId) {
      await tx.cashMovement.create({
        data: {
          cashSessionId: sale.cashSessionId,
          type: "REFUND",
          amount: cashPaid,
          description: `AnulaciÃ³n venta ${sale.code}: ${input.reason}`,
          saleId,
          userId,
        },
      });
    }

    if (sale.taxDocument) {
      await tx.taxDocument.update({
        where: { saleId },
        data: {
          status: "CANCELLED",
          siiResponse: `Documento anulado localmente: ${input.reason}`,
        },
      });
    }

    return tx.sale.update({
      where: { id: saleId },
      data: {
        status: "CANCELLED",
        notes: sale.notes
          ? `${sale.notes}\nANULACIÃ“N: ${input.reason}`
          : `ANULACIÃ“N: ${input.reason}`,
      },
      include: saleInclude,
    });
  });
};

export const issueTaxDocumentMock = async (
  saleId: string,
  input: IssueTaxDocumentInput,
) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { taxDocument: true },
  });

  if (!sale) throw new ApiError(404, "Venta no encontrada");
  if (sale.status !== "COMPLETED") {
    throw new ApiError(409, "La venta debe estar completada");
  }
  if (!sale.taxDocument) {
    throw new ApiError(404, "La venta no tiene documento tributario");
  }
  if (sale.taxDocument.status === "CANCELLED") {
    throw new ApiError(409, "El documento estÃ¡ anulado");
  }

  const folio =
    input.folio ??
    `MOCK-${Date.now().toString().slice(-10)}`;

  return prisma.taxDocument.update({
    where: { saleId },
    data: {
      status: "ISSUED",
      folio,
      siiTrackId: `LOCAL-${sale.id.slice(0, 8).toUpperCase()}`,
      siiResponse:
        "EmisiÃ³n simulada para ambiente acadÃ©mico. IntegraciÃ³n SII real pendiente.",
      issuedAt: new Date(),
    },
  });
};

