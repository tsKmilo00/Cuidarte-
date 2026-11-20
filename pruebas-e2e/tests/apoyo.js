// Funciones de apoyo que comparten todas las pruebas
// Usuarios de ejemplo de la base de datos: admin/admin, medico/medico, paciente/paciente
async function iniciarSesion(page, usuario, clave) {
  await page.goto("/login");
  await page.getByTestId("input-nombre-usuario").fill(usuario);
  await page.getByTestId("input-password").fill(clave);
  await page.getByTestId("button-login").click();
}

// Cierra sesión desde el menú de usuario (icono de la esquina superior derecha)
async function cerrarSesion(page) {
  await page.getByRole("button", { name: "Menú de usuario" }).click();
  await page.getByTestId("button-layout-logout").click();
}

module.exports = { iniciarSesion, cerrarSesion };
