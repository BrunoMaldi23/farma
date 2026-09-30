import type { RequestHandler } from "express";

import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/token.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new ApiError(401, "Token de acceso requerido"));
    return;
  }

  const token = header.slice(7);

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    next(new ApiError(401, "Token de acceso inválido o expirado"));
  }
};
