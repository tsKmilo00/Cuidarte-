/**
 * Middleware para simular delay en respuestas del servidor.
 * Útil para probar condiciones de red lentas, pero DESACTIVADO por defecto:
 * un retraso artificial de 5 s incumple NFR-PERF-1 (CRUD simple < 300 ms) y
 * hacía fallar la prueba de rendimiento (DEF-05).
 *
 * Para activarlo en una demostración: ENABLE_SIMULATED_DELAY=true
 */
const delayMiddleware = (ms = 5000) => {
  return (req, res, next) => {
    if (process.env.ENABLE_SIMULATED_DELAY !== "true") {
      return next();
    }
    setTimeout(() => {
      next();
    }, ms);
  };
};

module.exports = delayMiddleware;
