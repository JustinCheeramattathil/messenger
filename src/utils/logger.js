/* Minimal structured logger — keeps dependencies light. */
const timestamp = () => new Date().toISOString();

export const logger = {
  info: (message) => console.log(`[${timestamp()}] [INFO] ${message}`),
  warn: (message) => console.warn(`[${timestamp()}] [WARN] ${message}`),
  error: (message) => console.error(`[${timestamp()}] [ERROR] ${message}`),
};
