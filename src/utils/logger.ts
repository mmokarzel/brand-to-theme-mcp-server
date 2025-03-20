import winston from 'winston';

// Configuración del logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'brand-to-theme-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'brand-to-theme.log' 
    })
  ],
});

// Si estamos en modo desarrollo, mostrar logs más detallados
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
}