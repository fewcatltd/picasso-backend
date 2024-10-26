import winston from 'winston'
import Config from './сonfig.js'

export default winston.createLogger({
  level: Config.winston.level,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
})
