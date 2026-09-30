export const normalizeRut = (rut: string) => {
  return rut.replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();
};
