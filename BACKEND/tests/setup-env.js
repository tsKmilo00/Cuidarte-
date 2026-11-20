// Datos de conexión que usan las pruebas cuando no se indican otros.
// Apuntan a la base de datos que levanta docker compose (puerto 15442).
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:15442/cuidarteplus";
// En Docker Compose (y en el pipeline) la API usa este valor por defecto si no hay .env.
// Las pruebas de integración inician sesión contra la API real vía Supertest, por lo que
// el secreto solo debe coincidir con el que usa el propio proceso de pruebas.
process.env.JWT_SECRET = process.env.JWT_SECRET || "clave-solo-para-pruebas";
