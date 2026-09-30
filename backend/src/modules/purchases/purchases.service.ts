import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type {
  createPurchaseOrderSchema,
  purchaseOrdersQuerySchema,
  receivePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
} from "./purchases.schemas.js";

type PurchaseOrdersQuery = z.infer<typeof purchaseOrdersQuerySchema>;
type CreatePurchaseOrder = z.infer<typeof createPurchaseOrderSchema>;
type ReceivePurchaseOrder = z.infer<typeof receivePurchaseOrderSchema>;
type UpdateStatus = z.infer<typeof updatePurchaseOrderStatusSchema>;

const orderInclude = {
  supplier: true,
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
    },
  },
  details: {
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          presentation: true,
        },
      },
    },
  },
  receipts: true,
} as const;

export const listPurchaseOrders = async (query: PurchaseOrdersQuery) => {
  const { page, limit, search, supplierId, status } = query;
  const { skip, take } = getPagination(page, limit);

  const where = {
    ...(supplierId ? { supplierId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            {
              supplier: {
                businessName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.purchaseOrder.findMany({
      where,
      include: orderInclude,
      skip,
      take,
      orderBy: { orderDate: "desc" },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getPurchaseOrder = async (id: string) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) throw new ApiError(404, "Orden de compra no encontrada");
  return order;
};

export const createPurchaseOrder = async (
  userId: string,
  input: CreatePurchaseOrder,
) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: input.supplierId },
  });

  if (!supplier || !supplier.isActive) {
    throw new ApiError(400, "Proveedor inexistente o inactivo");
  }

  const productIds = [...new Set(input.details.map((d) => d.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true },
  });

  if (products.length !== productIds.length) {
    throw new ApiError(400, "Uno o más productos no existen o están inactivos");
  }

  const subtotal = input.details.reduce(
    (sum, item) => sum + item.quantityOrdered * item.unitCost,
    0,
  );
  const taxAmount = subtotal * (input.taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  return prisma.purchaseOrder.create({
    data: {
      code: input.code,
      supplierId: input.supplierId,
      createdById: userId,
      expectedDate: input.expectedDate ?? null,
      notes: input.notes ?? null,
      subtotal,
      taxAmount,
      totalAmount,
      details: {
        create: input.details.map((item) => ({
          productId: item.productId,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost,
          subtotal: item.quantityOrdered * item.unitCost,
        })),
      },
    },
    include: orderInclude,
  });
};

export const updatePurchaseOrderStatus = async (
  id: string,
  input: UpdateStatus,
) => {
  const order = await getPurchaseOrder(id);

  if (order.status === "RECEIVED" && input.status !== "RECEIVED") {
    throw new ApiError(409, "Una orden recibida no puede volver a un estado anterior");
  }

  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: input.status },
    include: orderInclude,
  });
};

export const receivePurchaseOrder = async (
  orderId: string,
  userId: string,
  input: ReceivePurchaseOrder,
) => {
  const order = await getPurchaseOrder(orderId);

  if (order.status === "CANCELLED") {
    throw new ApiError(409, "No se puede recepcionar una orden cancelada");
  }

  if (order.status === "RECEIVED") {
    throw new ApiError(409, "La orden ya fue recepcionada completamente");
  }

  const detailByProduct = new Map(
    order.details.map((detail) => [detail.productId, detail]),
  );

  for (const item of input.items) {
    const detail = detailByProduct.get(item.productId);

    if (!detail) {
      throw new ApiError(
        400,
        `El producto ${item.productId} no pertenece a la orden`,
      );
    }

    const remaining = detail.quantityOrdered - detail.quantityReceived;
    if (item.quantity > remaining) {
      throw new ApiError(
        400,
        `La cantidad recibida para ${detail.product.name} supera el saldo pendiente`,
      );
    }

    if (item.expirationDate <= new Date()) {
      throw new ApiError(
        400,
        `El lote de ${detail.product.name} no puede estar vencido`,
      );
    }

    const location = await prisma.inventoryLocation.findUnique({
      where: { id: item.locationId },
    });

    if (!location || !location.isActive) {
      throw new ApiError(400, "Ubicación de inventario inexistente o inactiva");
    }
  }

  return prisma.$transaction(async (tx) => {
    const receipt = await tx.purchaseReceipt.create({
      data: {
        code: input.code,
        purchaseOrderId: orderId,
        receivedById: userId,
        notes: input.notes ?? null,
      },
    });

    for (const item of input.items) {
      const detail = detailByProduct.get(item.productId)!;

      const batch = await tx.batch.upsert({
        where: {
          productId_batchNumber: {
            productId: item.productId,
            batchNumber: item.batchNumber,
          },
        },
        update: {
          supplierId: order.supplierId,
          purchaseReceiptId: receipt.id,
          expirationDate: item.expirationDate,
          manufacturingDate: item.manufacturingDate ?? null,
          initialQuantity: { increment: item.quantity },
          purchasePrice: item.purchasePrice,
        },
        create: {
          batchNumber: item.batchNumber,
          productId: item.productId,
          supplierId: order.supplierId,
          purchaseReceiptId: receipt.id,
          manufacturingDate: item.manufacturingDate ?? null,
          expirationDate: item.expirationDate,
          initialQuantity: item.quantity,
          purchasePrice: item.purchasePrice,
        },
      });

      await tx.inventoryStock.upsert({
        where: {
          batchId_locationId: {
            batchId: batch.id,
            locationId: item.locationId,
          },
        },
        update: {
          quantity: { increment: item.quantity },
        },
        create: {
          batchId: batch.id,
          locationId: item.locationId,
          quantity: item.quantity,
          reservedQuantity: 0,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          type: "PURCHASE_RECEIPT",
          productId: item.productId,
          batchId: batch.id,
          destinationLocationId: item.locationId,
          quantity: item.quantity,
          unitCost: item.purchasePrice,
          referenceType: "PURCHASE_RECEIPT",
          referenceId: receipt.id,
          userId,
        },
      });

      await tx.purchaseOrderDetail.update({
        where: { id: detail.id },
        data: {
          quantityReceived: { increment: item.quantity },
        },
      });
    }

    const refreshedDetails = await tx.purchaseOrderDetail.findMany({
      where: { purchaseOrderId: orderId },
    });

    const fullyReceived = refreshedDetails.every(
      (detail) => detail.quantityReceived >= detail.quantityOrdered,
    );

    await tx.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
      },
    });

    return tx.purchaseReceipt.findUnique({
      where: { id: receipt.id },
      include: {
        purchaseOrder: true,
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        batches: {
          include: {
            product: true,
            stocks: {
              include: { location: true },
            },
          },
        },
      },
    });
  });
};
