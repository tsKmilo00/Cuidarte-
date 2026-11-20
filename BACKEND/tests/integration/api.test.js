// PRUEBAS DE INTEGRACIÓN
// Verifican que la API, la validación, la seguridad (JWT) y la base de datos
// PostgreSQL funcionen bien JUNTAS. Requieren la base de datos encendida
// (docker compose up -d cuidarteplus-postgres-ev).
//
// Usuarios de ejemplo que trae la base: admin/admin, medico/medico, paciente/paciente.
// El usuario "paciente" es dueño de la ficha de paciente con id 1.
const request = require("supertest");
const app = require("../../src/app");
const { pool } = require("../../src/db");

async function iniciarSesion(usuario, clave) {
  const res = await request(app)
    .post("/autenticacion/login")
    .send({ nombre_usuario: usuario, password: clave });
  return res.body.token;
}

const conToken = (token) => ({ Authorization: `Bearer ${token}` });

function pacienteDePrueba() {
  const n = Math.floor(10000000 + Math.random() * 89999999);
  return {
    rut: `${n}-9`,
    primer_nombre: "Paciente",
    apellido_paterno: "De Prueba",
    fecha_nacimiento: "1990-01-15",
    sexo: "F",
    email: `prueba${n}@correo.cl`,
  };
}

let tokenAdmin;
let tokenMedico;
let tokenPaciente;

beforeAll(async () => {
  tokenAdmin = await iniciarSesion("admin", "admin");
  tokenMedico = await iniciarSesion("medico", "medico");
  tokenPaciente = await iniciarSesion("paciente", "paciente");
});

afterAll(async () => {
  // Limpieza directa en la base: no depende de los permisos de la API
  await pool.query("DELETE FROM usuarios WHERE nombre_usuario LIKE 'itest_%'");
  await pool.query("DELETE FROM roles WHERE nombre LIKE 'itest_%'");
  await pool.query("DELETE FROM pacientes WHERE email LIKE 'prueba%@correo.cl'");
  await pool.end();
});

describe("RF-1 Autenticación", () => {
  test("Credenciales correctas -> 200 y entrega un token", async () => {
    const res = await request(app)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("Contraseña incorrecta -> 401", async () => {
    const res = await request(app)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "equivocada" });
    expect(res.status).toBe(401);
  });

  test("Datos incompletos -> 400 (lo detiene la validación)", async () => {
    const res = await request(app).post("/autenticacion/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("RB-1 / RB-3 / NFR-SEG-4 Control de acceso a pacientes", () => {
  test("Sin token no se puede listar pacientes -> 401", async () => {
    const res = await request(app).get("/pacientes");
    expect(res.status).toBe(401);
  });

  test("Un paciente NO puede listar a todos los pacientes -> 403", async () => {
    const res = await request(app).get("/pacientes").set(conToken(tokenPaciente));
    expect(res.status).toBe(403);
  });

  test("Un médico puede listar pacientes -> 200", async () => {
    const res = await request(app).get("/pacientes").set(conToken(tokenMedico));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("Un paciente puede ver su propia ficha -> 200", async () => {
    const res = await request(app).get("/pacientes/1").set(conToken(tokenPaciente));
    expect(res.status).toBe(200);
    expect(res.body.rut).toBeDefined();
  });

  test("Un paciente NO puede ver la ficha de otra persona -> 403", async () => {
    const res = await request(app).get("/pacientes/2").set(conToken(tokenPaciente));
    expect(res.status).toBe(403);
  });
});

describe("RF-2.2 / RB-2 Registro y eliminación de pacientes", () => {
  test("Un médico registra un paciente válido -> 201", async () => {
    const res = await request(app)
      .post("/pacientes")
      .set(conToken(tokenMedico))
      .send(pacienteDePrueba());
    expect(res.status).toBe(201);
  });

  test("Un paciente NO puede registrar pacientes -> 403", async () => {
    const res = await request(app)
      .post("/pacientes")
      .set(conToken(tokenPaciente))
      .send(pacienteDePrueba());
    expect(res.status).toBe(403);
  });

  test("Datos inválidos -> 400 (RUT sin formato)", async () => {
    const res = await request(app)
      .post("/pacientes")
      .set(conToken(tokenMedico))
      .send({ ...pacienteDePrueba(), rut: "abc" });
    expect(res.status).toBe(400);
  });

  test("Un médico NO puede eliminar pacientes (solo administrador) -> 403", async () => {
    const creado = await request(app)
      .post("/pacientes")
      .set(conToken(tokenAdmin))
      .send(pacienteDePrueba());
    const res = await request(app)
      .delete(`/pacientes/${creado.body.id}`)
      .set(conToken(tokenMedico));
    expect(res.status).toBe(403);
  });

  test("Un administrador sí puede eliminar pacientes -> 200", async () => {
    const creado = await request(app)
      .post("/pacientes")
      .set(conToken(tokenAdmin))
      .send(pacienteDePrueba());
    const res = await request(app)
      .delete(`/pacientes/${creado.body.id}`)
      .set(conToken(tokenAdmin));
    expect(res.status).toBe(200);
  });
});

describe("RF-3.1 Exámenes médicos", () => {
  test("Un paciente NO puede registrar exámenes -> 403", async () => {
    const res = await request(app)
      .post("/examenes")
      .set(conToken(tokenPaciente))
      .send({ tipo_examen_medico_id: 1, paciente_id: 1 });
    expect(res.status).toBe(403);
  });

  test("Un médico registra un examen y el paciente lo ve en sus resultados", async () => {
    const creado = await request(app)
      .post("/examenes")
      .set(conToken(tokenMedico))
      .send({ tipo_examen_medico_id: 1, paciente_id: 1, observaciones: "Prueba de integración" });
    expect(creado.status).toBe(201);

    const lista = await request(app).get("/examenes").set(conToken(tokenPaciente));
    expect(lista.status).toBe(200);
    expect(lista.body.some((e) => e.id === creado.body.id)).toBe(true);

    await request(app).delete(`/examenes/${creado.body.id}`).set(conToken(tokenAdmin));
  });
});

describe("NFR-SEG-4 Control de rol en la administración de usuarios y roles", () => {
  const nuevoUsuario = () => {
    const id = `itest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return { nombre_usuario: id, contrasena_hash: "clave123", correo: `${id}@correo.cl` };
  };

  test("DEF-01: sin token NO se puede eliminar un usuario -> 401", async () => {
    const creado = await request(app)
      .post("/usuarios")
      .set(conToken(tokenAdmin))
      .send(nuevoUsuario());
    expect(creado.status).toBe(201);

    const res = await request(app).delete(`/usuarios/${creado.body.id}`);
    expect(res.status).toBe(401);
  });

  test("DEF-01b: un paciente NO puede eliminar usuarios -> 403", async () => {
    const creado = await request(app)
      .post("/usuarios")
      .set(conToken(tokenAdmin))
      .send(nuevoUsuario());
    const res = await request(app)
      .delete(`/usuarios/${creado.body.id}`)
      .set(conToken(tokenPaciente));
    expect(res.status).toBe(403);
  });

  test("DEF-02: un paciente NO puede crear usuarios con rol administrador -> 403", async () => {
    const res = await request(app)
      .post("/usuarios")
      .set(conToken(tokenPaciente))
      .send({ ...nuevoUsuario(), rol_id: 1 });
    expect(res.status).toBe(403);
  });

  test("DEF-03: sin token NO se puede crear un rol -> 401", async () => {
    const res = await request(app).post("/roles").send({ nombre: `itest_${Date.now()}` });
    expect(res.status).toBe(401);
  });

  test("DEF-04: un administrador elimina un usuario y el sistema responde 200 (con auditoría)", async () => {
    const creado = await request(app)
      .post("/usuarios")
      .set(conToken(tokenAdmin))
      .send(nuevoUsuario());
    const res = await request(app)
      .delete(`/usuarios/${creado.body.id}`)
      .set(conToken(tokenAdmin));
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });
});
