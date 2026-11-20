// PRUEBA DE ACCESIBILIDAD (NFR-USAB-1, criterio 3.1.1): revisa las páginas públicas con las reglas WCAG
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

for (const ruta of ["/login", "/registro"]) {
  test(`La página ${ruta} no tiene problemas críticos de accesibilidad`, async ({ page }) => {
    await page.goto(ruta);
    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    // Mostramos en consola todo lo encontrado, para el informe
    for (const v of resultado.violations) {
      console.log(`[${ruta}] [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} elementos)`);
    }

    const graves = resultado.violations.filter((v) => v.impact === "critical");
    expect(graves).toEqual([]);
  });
}
