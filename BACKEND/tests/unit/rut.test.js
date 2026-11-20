// PRUEBA UNITARIA DE CAJA BLANCA: normalizeRut tiene dos caminos (con y sin valor).
const { normalizeRut } = require("../../src/utils/rut");

test("Sin RUT devuelve el mismo valor (null / undefined / vacío)", () => {
  expect(normalizeRut(null)).toBeNull();
  expect(normalizeRut(undefined)).toBeUndefined();
  expect(normalizeRut("")).toBe("");
});

test("Quita los puntos y conserva el guion y el dígito verificador", () => {
  expect(normalizeRut("12.345.678-9")).toBe("12345678-9");
  expect(normalizeRut("16.789.456-K")).toBe("16789456-K");
});

test("Un RUT que ya viene normalizado no cambia", () => {
  expect(normalizeRut("12345678-9")).toBe("12345678-9");
});
