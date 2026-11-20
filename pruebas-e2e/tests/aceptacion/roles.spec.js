// PRUEBAS DE ACEPTACIÓN: reglas de negocio RB-1, RB-2 y RB-3 (roles)
const { test, expect } = require("@playwright/test");
const { iniciarSesion } = require("../apoyo");

const botonEliminar = '[data-testid^="button-cliente-eliminar-"]';
const botonEditar = '[data-testid^="button-cliente-editar-"]';

test("CA-RB2: el administrador ve la opción de eliminar pacientes", async ({ page }) => {
  // Dado un administrador / Cuando abre la lista de pacientes
  await iniciarSesion(page, "admin", "admin");
  await expect(page).toHaveURL(/\/home/);
  await page.goto("/pacientes");
  // Entonces ve la opción de editar y la de eliminar
  await expect(page.locator(botonEditar).first()).toBeVisible();
  await expect(page.locator(botonEliminar).first()).toBeVisible();
});

test("CA-RB3: el médico ve la lista de pacientes pero NO la opción de eliminar", async ({ page }) => {
  // Dado un médico / Cuando abre la lista de pacientes
  await iniciarSesion(page, "medico", "medico");
  await expect(page).toHaveURL(/\/home/);
  await page.goto("/pacientes");
  // Entonces puede ver y editar, pero no tiene la opción de eliminar
  await expect(page.locator(botonEditar).first()).toBeVisible();
  await expect(page.locator(botonEliminar)).toHaveCount(0);
});

test("CA-RB1: el paciente no accede a la lista de pacientes", async ({ page }) => {
  // Dado un paciente / Cuando intenta abrir la lista de pacientes
  await iniciarSesion(page, "paciente", "paciente");
  await expect(page).toHaveURL(/\/home/);
  // Solo la lista completa de la API (no la página del frontend ni la ficha propia /pacientes/1)
  const api = process.env.API_URL || "http://localhost:4444";
  const respuesta = page.waitForResponse(
    (r) => r.url() === `${api}/pacientes` && r.request().method() === "GET"
  );
  await page.goto("/pacientes");
  // Entonces el servidor lo rechaza (403) y la pantalla no muestra ningún paciente
  expect((await respuesta).status()).toBe(403);
  await expect(page.locator(botonEditar)).toHaveCount(0);
});
