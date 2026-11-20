const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "inseguro";

/**
 * Middleware: exige un token válido Y que el usuario tenga el rol "admin".
 * El rol se consulta en la base de datos (no se confía solo en lo que dice el token).
 *  - Sin token o token inválido -> 401
 *  - Con token pero sin rol admin  -> 403
 * Si todo está bien, deja el usuario del token en req.authUser.
 * (NFR-SEG-4: control de acceso por rol en el backend, RB-2)
 */
async function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado", glosa: "Token inválido" });
  }

  let authUser;
  try {
    authUser = jwt.verify(auth.substring(7), JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "No autorizado", glosa: "Token inválido" });
  }

  try {
    const result = await pool.query(
      `SELECT r.nombre
         FROM usuario_roles ur
         JOIN roles r ON r.id = ur.rol_id
        WHERE ur.usuario_id = $1`,
      [authUser.usuarioId]
    );
    const roles = result.rows.map((r) => r.nombre);
    if (!roles.includes("admin")) {
      return res.status(403).json({
        error: "No autorizado",
        glosa: "Solo un administrador puede realizar esta acción",
      });
    }
    req.authUser = authUser;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error al verificar roles",
      glosa: err.message || err.toString(),
    });
  }
}

module.exports = requireAdmin;
