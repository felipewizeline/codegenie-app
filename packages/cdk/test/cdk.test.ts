import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import CuriousCrowdStack from '../lib/cdk-stack'

test('Snapshot test', () => {
  const app = new cdk.App({
    context: {
      env: 'test',
      environmentConfig: {
        test: {
          profile: 'curious-crowd_test',
          region: 'us-west-2',
          logRetentionInDays: 1,
          amplify: {},
          api: {
            domainEnabled: false,
          },
        },
      },
    },
  })
  const stack = new CuriousCrowdStack(app, 'TestStack')
  const template = Template.fromStack(stack)
  expect(template).toMatchSnapshot()
})