#!/usr/bin/env node
import 'source-map-support/register'
import { App, Tags } from 'aws-cdk-lib'
import CuriousCrowdStack from '../lib/cdk-stack'
import { getEnvironmentName, getEnvironmentConfig, getIsProdish } from '../lib/environment-config'

const app = new App()
const isTerminationProtectionEnabled = getIsProdish({ node: app.node })
const envName = getEnvironmentName(app.node)
const environmentConfig = getEnvironmentConfig(app.node)
const region = environmentConfig.region || 'us-west-2'

new CuriousCrowdStack(app, `CuriousCrowd-${envName}`, {
  terminationProtection: isTerminationProtectionEnabled,
  env: {
    region,
  },
})

Tags.of(app).add('app', 'Curious Crowd')
Tags.of(app).add('environment', envName)
Tags.of(app).add('code-genie', '1')