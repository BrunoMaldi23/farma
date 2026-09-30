import type { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { settingSchema } from "./settings.schemas.js";

export const listSettings = async (_req: Request, res: Response) => {
  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  res.json({ ok: true, settings });
};

export const upsertSetting = async (req: Request, res: Response) => {
  const input = settingSchema.parse(req.body);
  const setting = await prisma.systemSetting.upsert({
    where: { key: input.key },
    update: input,
    create: input,
  });
  res.json({ ok: true, setting });
};

export const publicSettings = async (_req: Request, res: Response) => {
  const settings = await prisma.systemSetting.findMany({
    where: { isPublic: true },
    select: { key: true, value: true },
    orderBy: { key: "asc" },
  });
  res.json({ ok: true, settings });
};
