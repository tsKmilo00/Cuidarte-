// PRUEBAS UNITARIAS DE CAJA BLANCA
// Se diseñaron mirando el código: hay un caso por cada camino posible de
// resolverAccesoPaciente (RB-1: el paciente solo ve lo suyo; RB-3: el médico ve todo).
const { resolverAccesoPaciente } = require("../../src/utils/acceso");

describe("resolverAccesoPaciente (RB-1, RB-3, NFR-SEG-4)", () => {
  test("Camino 1: roles no es una lista -> error", () => {
    expect(() => resolverAccesoPaciente("paciente", 1, 1)).toThrow("lista");
  });

  test("Camino 2: usuario sin rol válido -> 403", () => {
    const r = resolverAccesoPaciente([], null, 1);
    expect(r).toMatchObject({ permitido: false, status: 403 });
  });

  test("Camino 3: médico accede a cualquier paciente -> permitido", () => {
    expect(resolverAccesoPaciente(["medico"], null, 99)).toEqual({ permitido: true, status: 200 });
  });

  test("Camino 3b: administrador accede a cualquier paciente -> permitido", () => {
    expect(resolverAccesoPaciente(["admin"], null, 99).permitido).toBe(true);
  });

  test("Camino 3c: paciente que además es médico se trata como médico -> permitido", () => {
    expect(resolverAccesoPaciente(["paciente", "medico"], null, 99).permitido).toBe(true);
  });

  test("Camino 4: paciente sin ficha asociada -> 404", () => {
    const r = resolverAccesoPaciente(["paciente"], null, 1);
    expect(r).toMatchObject({ permitido: false, status: 404 });
  });

  test("Camino 5: paciente pide la ficha de otra persona -> 403", () => {
    const r = resolverAccesoPaciente(["paciente"], 1, 2);
    expect(r).toMatchObject({ permitido: false, status: 403 });
    expect(r.glosa).toMatch(/propios datos/);
  });

  test("Camino 6: paciente pide su propia ficha -> permitido", () => {
    expect(resolverAccesoPaciente(["paciente"], 1, 1).permitido).toBe(true);
  });

  test("Camino 6b: el id llega como texto desde la URL ('1') y coincide -> permitido", () => {
    expect(resolverAccesoPaciente(["paciente"], 1, "1").permitido).toBe(true);
  });
});
