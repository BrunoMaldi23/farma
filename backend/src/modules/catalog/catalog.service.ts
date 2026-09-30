import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type { z } from "zod";
import type {
  basicCatalogCreateSchema,
  basicCatalogUpdateSchema,
  catalogQuerySchema,
  productCreateSchema,
  productUpdateSchema,
  productsQuerySchema,
} from "./catalog.schemas.js";

type BasicCreate = z.infer<typeof basicCatalogCreateSchema>;
type BasicUpdate = z.infer<typeof basicCatalogUpdateSchema>;
type CatalogQuery = z.infer<typeof catalogQuerySchema>;
type ProductCreate = z.infer<typeof productCreateSchema>;
type ProductUpdate = z.infer<typeof productUpdateSchema>;
type ProductsQuery = z.infer<typeof productsQuerySchema>;

type BasicKind = "category" | "laboratory" | "activeIngredient";

const catalogModel = (kind: BasicKind) => {
  if (kind === "category") return prisma.category;
  if (kind === "laboratory") return prisma.laboratory;
  return prisma.activeIngredient;
};

export const listBasicCatalog = async (kind: BasicKind, query: CatalogQuery) => {
  const { page, limit, search, active } = query;
  const { skip, take } = getPagination(page, limit);
  const model = catalogModel(kind) as any;

  const where = {
    ...(active ? { isActive: active === "true" } : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    model.findMany({ where, skip, take, orderBy: { name: "asc" } }),
    model.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getBasicCatalog = async (kind: BasicKind, id: string) => {
  const model = catalogModel(kind) as any;
  const item = await model.findUnique({ where: { id } });
  if (!item) throw new ApiError(404, "Registro no encontrado");
  return item;
};

export const createBasicCatalog = async (kind: BasicKind, input: BasicCreate) => {
  const model = catalogModel(kind) as any;
  return model.create({ data: input });
};

export const updateBasicCatalog = async (kind: BasicKind, id: string, input: BasicUpdate) => {
  await getBasicCatalog(kind, id);
  const model = catalogModel(kind) as any;
  return model.update({ where: { id }, data: input });
};

export const deleteBasicCatalog = async (kind: BasicKind, id: string) => {
  await getBasicCatalog(kind, id);
  const model = catalogModel(kind) as any;
  await model.delete({ where: { id } });
  return { message: "Registro eliminado correctamente" };
};

const productInclude = {
  category: true,
  laboratory: true,
  activeIngredients: {
    include: {
      activeIngredient: true,
    },
  },
} as const;

const validateProductReferences = async (
  categoryId: string | undefined,
  laboratoryId: string | null | undefined,
  ingredients: ProductCreate["activeIngredients"] | undefined,
) => {
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || !category.isActive) {
      throw new ApiError(400, "La categoría no existe o está inactiva");
    }
  }

  if (laboratoryId) {
    const laboratory = await prisma.laboratory.findUnique({ where: { id: laboratoryId } });
    if (!laboratory || !laboratory.isActive) {
      throw new ApiError(400, "El laboratorio no existe o está inactivo");
    }
  }

  if (ingredients?.length) {
    const ids = [...new Set(ingredients.map((i) => i.activeIngredientId))];
    const count = await prisma.activeIngredient.count({
      where: { id: { in: ids }, isActive: true },
    });
    if (count !== ids.length) {
      throw new ApiError(400, "Uno o más principios activos no existen o están inactivos");
    }
  }
};

export const listProducts = async (query: ProductsQuery) => {
  const { page, limit, search } = query;
  const { skip, take } = getPagination(page, limit);

  const where = {
    ...(query.active ? { isActive: query.active === "true" } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.laboratoryId ? { laboratoryId: query.laboratoryId } : {}),
    ...(query.productType ? { productType: query.productType } : {}),
    ...(query.requiresPrescription
      ? { requiresPrescription: query.requiresPrescription === "true" }
      : {}),
    ...(query.isControlled ? { isControlled: query.isControlled === "true" } : {}),
    ...(query.isCenabast ? { isCenabast: query.isCenabast === "true" } : {}),
    ...(search
      ? {
          OR: [
            { sku: { contains: search, mode: "insensitive" as const } },
            { barcode: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            { concentration: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      skip,
      take,
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  if (!product) throw new ApiError(404, "Producto no encontrado");
  return product;
};

export const createProduct = async (input: ProductCreate) => {
  await validateProductReferences(
    input.categoryId,
    input.laboratoryId,
    input.activeIngredients,
  );

  const { activeIngredients, ...data } = input;

  const product = await prisma.product.create({
    data: {
      ...data,
      purchasePrice: data.purchasePrice ?? null,
      cenabastMaxPrice: data.cenabastMaxPrice ?? null,
      laboratoryId: data.laboratoryId ?? null,
      activeIngredients: activeIngredients.length
        ? {
            create: activeIngredients.map((item) => ({
              activeIngredientId: item.activeIngredientId,
              quantity: item.quantity ?? null,
              unit: item.unit ?? null,
            })),
          }
        : undefined,
    },
    include: productInclude,
  });

  return product;
};

export const updateProduct = async (id: string, input: ProductUpdate) => {
  await getProduct(id);

  await validateProductReferences(
    input.categoryId,
    input.laboratoryId,
    input.activeIngredients,
  );

  const { activeIngredients, ...data } = input;

  if (activeIngredients !== undefined) {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...data,
          ...(data.purchasePrice !== undefined
            ? { purchasePrice: data.purchasePrice }
            : {}),
          ...(data.cenabastMaxPrice !== undefined
            ? { cenabastMaxPrice: data.cenabastMaxPrice }
            : {}),
          ...(data.laboratoryId !== undefined
            ? { laboratoryId: data.laboratoryId }
            : {}),
        },
      });

      await tx.productActiveIngredient.deleteMany({ where: { productId: id } });

      if (activeIngredients.length) {
        await tx.productActiveIngredient.createMany({
          data: activeIngredients.map((item) => ({
            productId: id,
            activeIngredientId: item.activeIngredientId,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
          })),
        });
      }
    });
  } else {
    await prisma.product.update({ where: { id }, data });
  }

  return getProduct(id);
};

export const deleteProduct = async (id: string) => {
  await getProduct(id);

  const references = await Promise.all([
    prisma.batch.count({ where: { productId: id } }),
    prisma.purchaseOrderDetail.count({ where: { productId: id } }),
    prisma.saleItem.count({ where: { productId: id } }),
    prisma.prescriptionItem.count({ where: { productId: id } }),
  ]);

  if (references.some((count) => count > 0)) {
    throw new ApiError(
      409,
      "El producto tiene movimientos asociados. Desactívalo en vez de eliminarlo.",
    );
  }

  await prisma.product.delete({ where: { id } });
  return { message: "Producto eliminado correctamente" };
};
