import { createLogger, format, transports } from 'winston'

const NODE_ENV_LOG_LEVEL_MAP = {
  test: 'error',
  development: 'debug',
  production: 'debug',
  // production: 'info', // Logs that are used for CloudWatch Metric Filters use log.info
}
const logLevel = process.env.LOG_LEVEL || NODE_ENV_LOG_LEVEL_MAP[process.env.NODE_ENV || 'development']
export const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: new transports.Console({
    handleExceptions: true,
    handleRejections: true,
  }),
  exitOnError: false,
})

let logMetadata = { awsRequestId: null }
// eslint-disable-next-line import/no-mutable-exports
export let log = logger.child(logMetadata)

export function setLogMetadata({ metadata }) {
  log = logger.child(metadata)
  logMetadata = {...metadata}
}

export function addLogMetadata({ metadata }) {
  const newLogMetadata = {
    ...logMetadata,
    ...metadata,
  }
  log = logger.child(newLogMetadata)
  logMetadata = newLogMetadata
}
