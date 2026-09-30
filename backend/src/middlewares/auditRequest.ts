import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";

const actionFromMethod = (method: string) => {
  switch (method.toUpperCase()) {
    case "POST":
      return "CREATE" as const;

    case "PUT":
    case "PATCH":
      return "UPDATE" as const;

    case "DELETE":
      return "DELETE" as const;

    default:
      return "OTHER" as const;
  }
};

export const auditRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    if (
      req.method === "GET" ||
      req.method === "HEAD" ||
      req.method === "OPTIONS"
    ) {
      return;
    }

    const auth = req.auth;

    const path = req.originalUrl.split("?")[0] ?? req.originalUrl ?? "/";

    const moduleName =
      path.split("/").filter(Boolean)[1] ?? "api";

    void prisma.auditLog
      .create({
        data: {
          userId: auth?.sub ?? null,

          action: actionFromMethod(req.method),

          module: moduleName.slice(0, 100),

          entity: path.slice(0, 100),

          entityId:
            typeof req.params?.id === "string"
              ? req.params.id.slice(0, 100)
              : null,

          description: `${req.method} ${path} -> ${res.statusCode}`,

          metadata: {
            method: req.method,
            path,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
          },

          ipAddress:
            req.ip?.slice(0, 64) ?? null,

          userAgent:
            req.get("user-agent")?.slice(0, 500) ?? null,
        },
      })
      .catch((error) => {
        console.error(
          "No se pudo registrar auditoría:",
          error,
        );
      });
  });

  next();
};