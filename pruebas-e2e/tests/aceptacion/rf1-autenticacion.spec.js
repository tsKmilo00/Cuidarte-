// PRUEBAS DE ACEPTACIÓN: cada prueba corresponde a un criterio de aceptación
// escrito en la ERS de Cuidarte+. Formato: Dado / Cuando / Entonces.
const { test, expect } = require("@playwright/test");
const { iniciarSesion, cerrarSesion } = require("../apoyo");

test("CA-RF1.1: un login exitoso abre la sesión y muestra el panel", async ({ page }) => {
  // Dado un usuario registrado (admin)
  // Cuando ingresa sus credenciales correctas
  await iniciarSesion(page, "admin", "admin");
  // Entonces entra al panel principal y ve su nombre
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByText("Bienvenido").first()).toBeVisible();
});

test("CA-RF1.2: el cierre de sesión invalida el acceso", async ({ page, isMobile }) => {
  test.skip(isMobile, "En celular el menú de usuario no está disponible en la barra superior");
  // Dado un usuario con sesión iniciada
  await iniciarSesion(page, "admin", "admin");
  await expect(page).toHaveURL(/\/home/);
  // Cuando cierra la sesión
  await cerrarSesion(page);
  // Entonces vuelve al login y ya no puede entrar a páginas protegidas
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/pacientes");
  await expect(page).toHaveURL(/\/login/);
});
