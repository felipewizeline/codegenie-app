import serverlessExpress from '@codegenie/serverless-express'
import app from './app'
import { log, addLogMetadata } from './utils/logger'

const serverlessExpressInstance = serverlessExpress({
  app,
  // log,
})

export const handler = (event, context) => {
  addLogMetadata({ metadata: { awsRequestId: context.awsRequestId } })
  return serverlessExpressInstance(event, context)
}
