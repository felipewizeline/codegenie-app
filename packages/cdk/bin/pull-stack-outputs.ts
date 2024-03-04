import { writeFileSync } from 'fs'
import * as path from 'path'
import { fromIni } from '@aws-sdk/credential-providers'
import { CloudFormationClient, DescribeStacksCommand, DescribeStacksOutput } from '@aws-sdk/client-cloudformation'

async function pullStackOutputs({ region, stackName, environment }: { region: string, stackName: string, environment: string }): Promise<any[]> {
  const client = new CloudFormationClient({
    region,
    credentials: fromIni({ profile: `curious-crowd_${environment}` }),
  })

  try {
    const command = new DescribeStacksCommand({
      StackName: stackName,
    })
    const stackResponse: DescribeStacksOutput = await client.send(command)

    if (!stackResponse.Stacks || stackResponse.Stacks.length === 0) {
      throw new Error(`Stack '${stackName}' not found in region '${region}'.`)
    }

    const stack = stackResponse.Stacks[0]

    if (!stack.Outputs) {
      throw new Error(`Stack '${stackName}' has no outputs.`)
    }

    return stack.Outputs
  } catch (error: any) {
    throw new Error(`Error retrieving CloudFormation stack outputs: ${error.message}`)
  } finally {
    client.destroy()
  }
}

function writeOutputs({ stackName, environment, outputs }: { stackName: string, environment: string, outputs: any }) {
  const outputFilePath = path.resolve(__dirname, `../cdk-outputs.${environment}.json`)
  const formattedOutput: any = {
    [stackName]: {},
  }
  outputs.forEach((output: any) => {
    formattedOutput[stackName][output.OutputKey] = output.OutputValue
  })
  const formattedOutputStringified = JSON.stringify(formattedOutput, null, 2)
  writeFileSync(outputFilePath, formattedOutputStringified, 'utf8')
}

async function main() {
  try {
    const region = 'us-west-2'
    const environment = process.env.ENVIRONMENT
    
    if (!environment) {
      console.error('ENVIRONMENT environment variable not set.')
      return
    }

    const stackName = `CuriousCrowd-${environment}`
    const outputs = await pullStackOutputs({ region, stackName, environment })
    writeOutputs({ stackName, outputs, environment })
  } catch (error: any) {
    console.error(error.message)
  }
}

main()
