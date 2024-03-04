/* eslint @typescript-eslint/no-var-requires: 0 */
import { writeFileSync } from 'fs'
import * as path from 'path'

const { ENVIRONMENT } = process.env

if (!ENVIRONMENT) {
  throw new Error('No ENVIRONMENT environment variable defined')
}

const nodeEnv = ENVIRONMENT === 'development' ? 'development' : 'production'
const outputs = require(`../cdk-outputs.${ENVIRONMENT}.json`)

if (!outputs) {
  const envShort = ENVIRONMENT === 'development' ? 'dev'
    : ENVIRONMENT === 'production' ? 'prod'
      : ENVIRONMENT
  throw new Error(`No cdk-outputs.${ENVIRONMENT}.json. Try running \`npm run pull-stack-outputs:${envShort}\``)
}

const cdkJsonEnvironmentConfig = require('../cdk.json').context.environmentConfig[ENVIRONMENT]
const stackOutputs = outputs[`CuriousCrowd-${ENVIRONMENT}`]
const SECRET_WARNING = `# WARNING: This file is committed to source control. Store secrets in .env.${ENVIRONMENT}.local instead of here.`
const apiDotEnv = `${SECRET_WARNING}
NODE_ENV=${nodeEnv}
USER_TABLE="${stackOutputs.UserTable}"
POST_TABLE="${stackOutputs.PostTable}"
COMMENT_TABLE="${stackOutputs.CommentTable}"`

writeFileSync(path.resolve(__dirname, `../../api/.env.${ENVIRONMENT}`), apiDotEnv)

let uiDotEnv = `NEXT_PUBLIC_ApiEndpoint="${stackOutputs.ApiEndpoint}"
NEXT_PUBLIC_CognitoUserPoolId="${stackOutputs.UserPoolId}"
NEXT_PUBLIC_CognitoUserPoolClientId="${stackOutputs.UserPoolClientId}"
NEXT_PUBLIC_Region="${stackOutputs.Region}"
AMPLIFY_URL="${stackOutputs.AmplifyUrl}"`

if (cdkJsonEnvironmentConfig.auth?.autoVerifyUsers) {
  uiDotEnv = `NEXT_PUBLIC_AUTO_VERIFY_USERS=1
${uiDotEnv}`
}

uiDotEnv = `${SECRET_WARNING}
${uiDotEnv}`

writeFileSync(path.resolve(__dirname, `../../ui/.env/.env.${ENVIRONMENT}`), uiDotEnv)
