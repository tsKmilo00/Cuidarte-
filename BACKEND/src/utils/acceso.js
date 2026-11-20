/**
 * Decide si un usuario puede ver la ficha de un paciente (RB-1, RB-3, NFR-SEG-4).
 *
 *  - Médico o administrador: pueden ver cualquier paciente (RB-2, RB-3).
 *  - Paciente: solo puede ver su propia ficha (RB-1).
 *  - Cualquier otro rol: sin acceso.
 *
 * @param {string[]} roles                 Nombres de rol del usuario autenticado.
 * @param {number|string|null} pacienteIdPropio  Id de la ficha asociada al usuario (null si no tiene).
 * @param {number|string} pacienteIdSolicitado   Id de la ficha que se quiere ver.
 * @returns {{permitido: boolean, status: number, error?: string, glosa?: string}}
 */
function resolverAccesoPaciente(roles, pacienteIdPropio, pacienteIdSolicitado) {
  if (!Array.isArray(roles)) {
    throw new Error("Los roles deben ser una lista");
  }

  const esMedicoOAdmin = roles.includes("medico") || roles.includes("admin");
  const esPaciente = roles.includes("paciente") && !esMedicoOAdmin;

  if (!esMedicoOAdmin && !esPaciente) {
    return {
      permitido: false,
      status: 403,
      error: "No autorizado",
      glosa: "No tiene permisos para realizar esta acción",
    };
  }

  if (esMedicoOAdmin) {
    return { permitido: true, status: 200 };
  }

  // A partir de aquí el usuario es solo "paciente"
  if (pacienteIdPropio === null || pacienteIdPropio === undefined) {
    return {
      permitido: false,
      status: 404,
      error: "Paciente no encontrado",
      glosa: "No se encontró información de paciente asociada a su cuenta",
    };
  }

  if (String(pacienteIdPropio) !== String(pacienteIdSolicitado)) {
    return {
      permitido: false,
      status: 403,
      error: "No autorizado",
      glosa: "Solo puede ver sus propios datos",
    };
  }

  return { permitido: true, status: 200 };
}

module.exports = { resolverAccesoPaciente };
