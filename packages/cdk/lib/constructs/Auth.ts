import * as path from 'path'
import { CfnOutput, Duration } from 'aws-cdk-lib'
import {
  UserPool,
  UserPoolClient,
  UserPoolEmail,
  UserPoolOperation,
} from 'aws-cdk-lib/aws-cognito'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { ITable } from 'aws-cdk-lib/aws-dynamodb'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import {
  getEnvironmentConfig,
  getIsDeletionProtectionEnabled,
  getIsSourceMapsEnabled,
  getRemovalPolicy,
} from '../environment-config'
import type { StringMap } from '../../../common/types'

const cognitoPackageDir = path.resolve(__dirname, '../../../cognito')

interface AuthProps {
  userTable: ITable
}

export default class Auth extends Construct {
  readonly userPool: UserPool
  readonly userPoolClient: UserPoolClient
  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id)

    this.userPool = this.createUserPool()
    this.userPoolClient = this.createUserPoolClient()
    this.addTriggers({ userTable: props.userTable })
  }

  createUserPool() {
    const environmentConfig = getEnvironmentConfig(this.node)

    // NOTE: If `verifyUserEmail` isn't set, use the built-in Cognito emailer. This is especially convenient for dev environments.
    const userPoolWithSesEmail = environmentConfig.email?.verifiedDomain && environmentConfig.email.verifyUserEmail ? UserPoolEmail.withSES({
      sesVerifiedDomain: environmentConfig.email.verifiedDomain,
      fromEmail: environmentConfig.email.verifyUserEmail,
      fromName: 'Curious Crowd',
    }) : undefined

    const userPool = new UserPool(this, 'UserPool', {
      signInCaseSensitive: false,
      deletionProtection: getIsDeletionProtectionEnabled({ node: this.node }),
      removalPolicy: getRemovalPolicy({ node: this.node }),
      passwordPolicy: {
        minLength: 8,
      },
      selfSignUpEnabled: true,
      signInAliases: {
        username: false,
        email: true,
      },
      email: userPoolWithSesEmail,
    })

    new CfnOutput(this, 'UserPoolId', { key: 'UserPoolId', value: userPool.userPoolId })

    return userPool
  }

  createUserPoolClient() {
    const userPoolClient = this.userPool.addClient('UserPoolClient', {
      idTokenValidity: Duration.days(1),
      refreshTokenValidity: Duration.days(90),
    })

    new CfnOutput(this, 'UserPoolClientId', { key: 'UserPoolClientId', value: userPoolClient.userPoolClientId })

    return userPoolClient
  }

  addTriggers({ userTable }: { userTable: ITable }) {
    this.addPreSignupTrigger()
    this.addPreTokenGenerationTrigger({ userTable })
    this.addCustomMessageTrigger()
  }

  // Pre Signup https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html
  addPreSignupTrigger() {
    const { auth, logRetentionInDays } = getEnvironmentConfig(this.node)
    const isSourceMapsEnabled = getIsSourceMapsEnabled({ node: this.node })

    const cognitoPreSignupLogGroup = new LogGroup(this, 'PreSignupLogGroup', {
      retention: logRetentionInDays,
    })

    const environment: StringMap = {}

    if (isSourceMapsEnabled) {
      environment.NODE_OPTIONS = '--enable-source-maps'
    }

    if (auth?.autoVerifyUsers) {
      environment.AUTO_VERIFY_USERS = '1'
    }

    const cognitoPreSignupFunction = new NodejsFunction(this, 'PreSignupFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(cognitoPackageDir, 'cognito-pre-signup.ts'),
      timeout: Duration.seconds(10),
      memorySize: 1024,
      logGroup: cognitoPreSignupLogGroup,
      bundling: {
        sourceMap: isSourceMapsEnabled,
      },
      environment,
    })
    this.userPool.addTrigger(UserPoolOperation.PRE_SIGN_UP, cognitoPreSignupFunction)
  }

  addPreTokenGenerationTrigger({ userTable }: { userTable: ITable }) {
    // Pre Token Generation https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html
    const { logRetentionInDays } = getEnvironmentConfig(this.node)
    const isSourceMapsEnabled = getIsSourceMapsEnabled({ node: this.node })
    const cognitoPreTokenGenerationLogGroup = new LogGroup(this, 'PreTokenGenerationLogGroup', {
      retention: logRetentionInDays,
    })

    const environment: StringMap = {
      USER_TABLE: userTable.tableName,
    }

    if (isSourceMapsEnabled) {
      environment.NODE_OPTIONS = '--enable-source-maps'
    }

    const cognitoPreTokenGenerationFunction = new NodejsFunction(this, 'PreTokenGenerationFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(cognitoPackageDir, 'cognito-pre-token-generation.ts'),
      timeout: Duration.seconds(10),
      memorySize: 1024,
      logGroup: cognitoPreTokenGenerationLogGroup,
      bundling: {
        sourceMap: isSourceMapsEnabled,
      },
      environment,
    })

    // Give the Lambda function permission to read and write to DynamoDB
    const dynamoDBReadWritePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
      ],
      resources: [
        userTable.tableArn,
      ],
    })
    cognitoPreTokenGenerationFunction.addToRolePolicy(dynamoDBReadWritePolicy)
    this.userPool.addTrigger(UserPoolOperation.PRE_TOKEN_GENERATION, cognitoPreTokenGenerationFunction)
  }

  addCustomMessageTrigger() {
    // Custom message https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-message.html
    const { logRetentionInDays } = getEnvironmentConfig(this.node)
    const isSourceMapsEnabled = getIsSourceMapsEnabled({ node: this.node })
    const cognitoCustomMessageLogGroup = new LogGroup(this, 'CustomMessageLogGroup', {
      retention: logRetentionInDays,
    })
    const environment: StringMap = {}

    if (isSourceMapsEnabled) {
      environment.NODE_OPTIONS = '--enable-source-maps'
    }

    const cognitoCustomMessageFunction = new NodejsFunction(this, 'CustomMessageFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(cognitoPackageDir, 'cognito-custom-message.ts'),
      timeout: Duration.seconds(10),
      memorySize: 1024,
      logGroup: cognitoCustomMessageLogGroup,
      bundling: {
        sourceMap: isSourceMapsEnabled,
      },
      environment,
    })
    this.userPool.addTrigger(UserPoolOperation.CUSTOM_MESSAGE, cognitoCustomMessageFunction)
  }
}