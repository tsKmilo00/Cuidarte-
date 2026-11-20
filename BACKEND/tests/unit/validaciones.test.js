// PRUEBAS UNITARIAS DE CAJA NEGRA
// Se diseñaron leyendo los requisitos (ERS), sin mirar el código:
// particiones de equivalencia y valores límite.
const { loginSchema, registerSchema } = require("../../src/validations/auth");
const { pacienteSchema } = require("../../src/validations/pacientes");
const { examenMedicoSchema } = require("../../src/validations/examenes");

const esValido = (schema, datos) => schema.isValid(datos);

describe("Login (RF-1.1): largo del nombre de usuario (3 a 50 caracteres)", () => {
  test.each([
    ["CN-01 vacío", "", false],
    ["CN-02 2 caracteres (límite inferior - 1)", "ab", false],
    ["CN-03 3 caracteres (límite inferior)", "abc", true],
    ["CN-04 50 caracteres (límite superior)", "a".repeat(50), true],
    ["CN-05 51 caracteres (límite superior + 1)", "a".repeat(51), false],
  ])("%s -> válido: %s", async (_caso, usuario, esperado) => {
    await expect(esValido(loginSchema, { nombre_usuario: usuario, password: "x" }))
      .resolves.toBe(esperado);
  });

  test("CN-06 sin contraseña -> inválido", async () => {
    await expect(esValido(loginSchema, { nombre_usuario: "admin" })).resolves.toBe(false);
  });
});

describe("Registro (RF-2.1): contraseña, correo y RUT", () => {
  const base = {
    nombre_usuario: "usuario1",
    password: "Abcdef1!",
    correo: "usuario1@correo.cl",
    rut: "12.345.678-9",
  };

  test("CN-07 datos correctos -> válido", async () => {
    await expect(esValido(registerSchema, base)).resolves.toBe(true);
  });

  test.each([
    ["CN-08 contraseña de 5 caracteres (límite - 1)", "12345", false],
    ["CN-09 contraseña de 6 caracteres (límite)", "123456", true],
  ])("%s -> válido: %s", async (_caso, password, esperado) => {
    await expect(esValido(registerSchema, { ...base, password })).resolves.toBe(esperado);
  });

  test.each([
    ["sin arroba", "usuario.correo.cl"],
    ["sin dominio", "usuario@"],
    ["vacío", ""],
  ])("CN-10 correo %s -> inválido", async (_caso, correo) => {
    await expect(esValido(registerSchema, { ...base, correo })).resolves.toBe(false);
  });

  test.each([
    ["con puntos y guion", "12.345.678-9", true],
    ["sin puntos", "12345678-9", true],
    ["dígito verificador K", "16789456-K", true],
    ["sin guion", "123456789", false],
    ["con letras", "abc", false],
  ])("CN-11 RUT %s -> válido: %s", async (_caso, rut, esperado) => {
    await expect(esValido(registerSchema, { ...base, rut })).resolves.toBe(esperado);
  });
});

describe("Pacientes (RF-2.2): datos obligatorios y rangos", () => {
  const base = {
    rut: "11.111.111-1",
    primer_nombre: "Juan",
    apellido_paterno: "Pérez",
    fecha_nacimiento: "1985-03-14",
    sexo: "M",
    email: "juan@correo.cl",
  };

  test("CN-12 datos mínimos correctos -> válido", async () => {
    await expect(esValido(pacienteSchema, base)).resolves.toBe(true);
  });

  test("CN-13 fecha de nacimiento futura -> inválido", async () => {
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await expect(esValido(pacienteSchema, { ...base, fecha_nacimiento: manana }))
      .resolves.toBe(false);
  });

  test.each([
    ["M", true],
    ["F", true],
    ["O", true],
    ["X", false],
    ["", false],
  ])("CN-14 sexo '%s' -> válido: %s", async (sexo, esperado) => {
    await expect(esValido(pacienteSchema, { ...base, sexo })).resolves.toBe(esperado);
  });

  test.each([
    ["O+", true],
    ["AB-", true],
    ["Z+", false],
  ])("CN-15 grupo sanguíneo '%s' -> válido: %s", async (grupo_sanguineo, esperado) => {
    await expect(esValido(pacienteSchema, { ...base, grupo_sanguineo })).resolves.toBe(esperado);
  });

  test("CN-16 nombre de 1 carácter (mínimo 2) -> inválido", async () => {
    await expect(esValido(pacienteSchema, { ...base, primer_nombre: "J" })).resolves.toBe(false);
  });

  test("CN-17 falta el RUT -> inválido", async () => {
    const { rut, ...sinRut } = base;
    await expect(esValido(pacienteSchema, sinRut)).resolves.toBe(false);
  });
});

describe("Exámenes (RF-3.1): paciente y tipo de examen obligatorios", () => {
  test("CN-18 datos correctos -> válido", async () => {
    await expect(esValido(examenMedicoSchema, { tipo_examen_medico_id: 1, paciente_id: 1 }))
      .resolves.toBe(true);
  });

  test.each([
    ["cero", 0],
    ["negativo", -5],
    ["texto", "abc"],
  ])("CN-19 paciente_id %s -> inválido", async (_caso, valor) => {
    await expect(esValido(examenMedicoSchema, { tipo_examen_medico_id: 1, paciente_id: valor }))
      .resolves.toBe(false);
  });

  test("CN-20 diagnóstico de 2001 caracteres (máximo 2000) -> inválido", async () => {
    await expect(esValido(examenMedicoSchema, {
      tipo_examen_medico_id: 1,
      paciente_id: 1,
      diagnosis: "a".repeat(2001),
    })).resolves.toBe(false);
  });
});
