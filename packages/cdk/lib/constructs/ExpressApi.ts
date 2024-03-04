import * as path from 'path'
import { Construct } from 'constructs'
import { CfnOutput, Duration, Fn, Stack } from 'aws-cdk-lib/core'
import { ITable } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Cors } from 'aws-cdk-lib/aws-apigateway'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import { CorsHttpMethod, HttpApi, HttpMethod , CfnStage, DomainName } from 'aws-cdk-lib/aws-apigatewayv2'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import Auth from './Auth'
import { getEnvironmentConfig, getEnvironmentName, getIsSourceMapsEnabled } from '../environment-config'

interface ExpressApiProps {
  auth: Auth
  userTable: ITable
  postTable: ITable
  commentTable: ITable
}

export default class ExpressApi extends Construct {
  public readonly api: HttpApi
  public readonly lambdaFunction: NodejsFunction
  constructor(scope: Construct, id: string, props: ExpressApiProps) {
    super(scope, id)

    this.lambdaFunction = this.createLambdaFunction({ props })
    this.api = this.createApi({ auth: props.auth })
  }

  createLambdaFunction({ props }: { props: ExpressApiProps }) {
    const environmentConfig = getEnvironmentConfig(this.node)
    const logGroup = new LogGroup(this, 'LogGroup', {
      retention: environmentConfig.logRetentionInDays,
    })
    const apiPackageDir = path.resolve(__dirname, '../../../api')
    const isSourceMapsEnabled = getIsSourceMapsEnabled({ node: this.node })
    const lambdaFunction = new NodejsFunction(this, 'LambdaFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(apiPackageDir, 'lambda.ts'),
      timeout: Duration.seconds(28),
      memorySize: 1024,
      logGroup,
      bundling: {
        sourceMap: isSourceMapsEnabled,
      },
      environment: {
        NODE_OPTIONS: isSourceMapsEnabled ? '--enable-source-maps' : '',
        USER_TABLE: props.userTable.tableName,
        POST_TABLE: props.postTable.tableName,
        COMMENT_TABLE: props.commentTable.tableName,
      },
    })

    this.grantLambdaFunctionDynamoDbReadWritePermissions({ lambdaFunction, props })

    return lambdaFunction
  }

  grantLambdaFunctionDynamoDbReadWritePermissions({ lambdaFunction, props }: { lambdaFunction: NodejsFunction, props: ExpressApiProps }) {
    // Grant the Lambda function permission to read and write to DynamoDB
    const dynamoDBReadWritePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem',
        'dynamodb:DeleteItem',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:UpdateItem',
      ],
      resources: [
        props.userTable.tableArn,
        Fn.join('', [props.userTable.tableArn, '/index/*']),
        props.postTable.tableArn,
        Fn.join('', [props.postTable.tableArn, '/index/*']),
        props.commentTable.tableArn,
        Fn.join('', [props.commentTable.tableArn, '/index/*']),
      ],
    })
    lambdaFunction.addToRolePolicy(dynamoDBReadWritePolicy)
  }

  createApi({ auth }: { auth: Auth }) {
    const authorizer = new HttpUserPoolAuthorizer('Authorizer', auth.userPool, {
      userPoolClients: [auth.userPoolClient],
    })
    const integration = new HttpLambdaIntegration('LambdaIntegration', this.lambdaFunction)
    const environmentConfig = getEnvironmentConfig(this.node)
    const domainName = environmentConfig.api?.domainName
    let domainResource

    if (domainName) {
      const certificate = new Certificate(this, 'Certificate', {
        domainName,
      })
      domainResource = new DomainName(this, 'DomainName', {
        domainName,
        certificate,
      })
    }
    
    const api = new HttpApi(this, 'HttpApi', {
      apiName: `CuriousCrowd-${getEnvironmentName(this.node)}`,
      corsPreflight: {
        allowHeaders: [
          // Must explicitly specify Authorization, othwerise maxAge isn't respected and preflight
          // will be sent on all requests https://twitter.com/annevk/status/1422959365846351875
          // Unfortunately, there appears to be a bug in API Gateway where it doesn't return the
          // correct preflight response headers when 'authorization' is defined.
          // 'authorization',
          '*',
        ],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: Cors.ALL_ORIGINS,
        maxAge: Duration.hours(24), // Firefox caps at 24 hours; Chromium caps at 2 hours
      },
      defaultDomainMapping: domainResource ? {
        domainName: domainResource,
      } : undefined,
    })
    api.addRoutes({
      path: '/{proxy+}',
      integration,
      authorizer,
      // Must exclude OPTIONS so that CORS Preflight requests don't get sent through to Lambda,
      // and instead are fulfilled by API Gateway
      methods: [
        HttpMethod.HEAD,
        HttpMethod.GET,
        HttpMethod.POST,
        HttpMethod.PATCH,
        HttpMethod.PUT,
        HttpMethod.DELETE,
      ],
    })

    // this.enableApiAccessLogs({ api })
    
    new CfnOutput(this, 'ApiEndpoint', { key: 'ApiEndpoint', value: domainResource ? api.defaultStage!.domainUrl : api.apiEndpoint })

    if (domainResource) {
      new CfnOutput(this, 'RegionalDomainName', {
        key: 'RegionalDomainName',
        value: domainResource.regionalDomainName,
        description: `You must create a CNAME record in your DNS using ${domainName} and this value`,
      })
    }

    return api
  }

  enableApiAccessLogs({ api }: { api: HttpApi }) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stage = api.defaultStage!.node.defaultChild as CfnStage
    const logGroup = new LogGroup(this, 'AccessLogs', {
      retention: getEnvironmentConfig(this.node).logRetentionInDays,
    })

    stage.accessLogSettings = {
      destinationArn: logGroup.logGroupArn,
      format: JSON.stringify({
        requestId: '$context.requestId',
        userAgent: '$context.identity.userAgent',
        sourceIp: '$context.identity.sourceIp',
        requestTime: '$context.requestTime',
        httpMethod: '$context.httpMethod',
        path: '$context.path',
        status: '$context.status',
        responseLength: '$context.responseLength',
      }),
    }

    logGroup.grantWrite(new ServicePrincipal('apigateway.amazonaws.com'))
  }
}