import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  cashRegistersQuerySchema,
  cashSessionsQuerySchema,
  closeCashSessionSchema,
  createCashMovementSchema,
  createCashRegisterSchema,
  openCashSessionSchema,
  updateCashRegisterSchema,
} from "./cash.schemas.js";

type RegistersQuery = z.infer<typeof cashRegistersQuerySchema>;
type CreateRegister = z.infer<typeof createCashRegisterSchema>;
type UpdateRegister = z.infer<typeof updateCashRegisterSchema>;
type OpenSession = z.infer<typeof openCashSessionSchema>;
type CloseSession = z.infer<typeof closeCashSessionSchema>;
type CreateMovement = z.infer<typeof createCashMovementSchema>;
type SessionsQuery = z.infer<typeof cashSessionsQuerySchema>;

const toNumber = (value: unknown) => Number(value ?? 0);

export const listCashRegisters = async (query: RegistersQuery) => {
  return prisma.cashRegister.findMany({
    where: {
      ...(query.active ? { isActive: query.active === "true" } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: "insensitive" as const } },
              { name: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { sessions: true } },
    },
    orderBy: { name: "asc" },
  });
};

export const createCashRegister = async (input: CreateRegister) => {
  return prisma.cashRegister.create({ data: input });
};

export const updateCashRegister = async (id: string, input: UpdateRegister) => {
  const register = await prisma.cashRegister.findUnique({ where: { id } });
  if (!register) throw new ApiError(404, "Caja no encontrada");

  return prisma.cashRegister.update({
    where: { id },
    data: input,
  });
};

export const listCashSessions = async (query: SessionsQuery) => {
  return prisma.cashSession.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
      ...(query.cashRegisterId ? { cashRegisterId: query.cashRegisterId } : {}),
    },
    include: {
      cashRegister: true,
      openedBy: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
      closedBy: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
      _count: { select: { sales: true, movements: true } },
    },
    take: query.limit,
    orderBy: { openedAt: "desc" },
  });
};

export const getCashSession = async (id: string) => {
  const session = await prisma.cashSession.findUnique({
    where: { id },
    include: {
      cashRegister: true,
      openedBy: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
      closedBy: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
      movements: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, username: true },
          },
        },
        orderBy: { occurredAt: "asc" },
      },
      sales: {
        select: {
          id: true,
          code: true,
          status: true,
          totalAmount: true,
          saleDate: true,
        },
        orderBy: { saleDate: "desc" },
      },
    },
  });

  if (!session) throw new ApiError(404, "Sesión de caja no encontrada");
  return session;
};

export const openCashSession = async (userId: string, input: OpenSession) => {
  const register = await prisma.cashRegister.findUnique({
    where: { id: input.cashRegisterId },
  });

  if (!register || !register.isActive) {
    throw new ApiError(400, "Caja inexistente o inactiva");
  }

  const existing = await prisma.cashSession.findFirst({
    where: {
      cashRegisterId: input.cashRegisterId,
      status: "OPEN",
    },
  });

  if (existing) {
    throw new ApiError(409, "Esta caja ya tiene una sesión abierta");
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.create({
      data: {
        cashRegisterId: input.cashRegisterId,
        openedById: userId,
        openingAmount: input.openingAmount,
        notes: input.notes ?? null,
      },
      include: { cashRegister: true },
    });

    if (input.openingAmount > 0) {
      await tx.cashMovement.create({
        data: {
          cashSessionId: session.id,
          type: "OPENING",
          amount: input.openingAmount,
          description: "Apertura de caja",
          userId,
        },
      });
    }

    return session;
  });
};

const signedMovementAmount = (type: string, amount: number) => {
  switch (type) {
    case "OPENING":
    case "SALE":
    case "INCOME":
      return amount;
    case "EXPENSE":
    case "REFUND":
    case "WITHDRAWAL":
      return -amount;
    case "ADJUSTMENT":
    default:
      return amount;
  }
};

export const getExpectedCashAmount = async (cashSessionId: string) => {
  const session = await prisma.cashSession.findUnique({
    where: { id: cashSessionId },
  });

  if (!session) throw new ApiError(404, "Sesión de caja no encontrada");

  const movements = await prisma.cashMovement.findMany({
    where: { cashSessionId },
    select: { type: true, amount: true },
  });

  const expected = movements.reduce(
    (sum, movement) =>
      sum + signedMovementAmount(movement.type, toNumber(movement.amount)),
    0,
  );

  return Math.round(expected);
};

export const closeCashSession = async (
  id: string,
  userId: string,
  input: CloseSession,
) => {
  const session = await prisma.cashSession.findUnique({ where: { id } });

  if (!session) throw new ApiError(404, "Sesión de caja no encontrada");
  if (session.status !== "OPEN") {
    throw new ApiError(409, "La sesión de caja no está abierta");
  }

  const expectedAmount = await getExpectedCashAmount(id);
  const differenceAmount = Math.round(input.countedAmount - expectedAmount);

  return prisma.cashSession.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedById: userId,
      expectedAmount,
      countedAmount: input.countedAmount,
      differenceAmount,
      closedAt: new Date(),
      notes: input.notes ?? session.notes,
    },
    include: {
      cashRegister: true,
      openedBy: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
      closedBy: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
    },
  });
};

export const createCashMovement = async (
  sessionId: string,
  userId: string,
  input: CreateMovement,
) => {
  const session = await prisma.cashSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) throw new ApiError(404, "Sesión de caja no encontrada");
  if (session.status !== "OPEN") {
    throw new ApiError(409, "La sesión de caja está cerrada");
  }

  const amount =
    input.type === "ADJUSTMENT" ? input.amount : Math.abs(input.amount);

  return prisma.cashMovement.create({
    data: {
      cashSessionId: sessionId,
      type: input.type,
      amount,
      description: input.description,
      userId,
    },
  });
};
