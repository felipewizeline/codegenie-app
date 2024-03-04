import { Construct } from 'constructs'
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { CfnOutput } from 'aws-cdk-lib'
import BaseTable from '../BaseTable'

export default class PostTable extends Construct {
  public readonly table: Table

  constructor(scope: Construct, id: string) {
    super(scope, id)

    const baseTable = new BaseTable(this, 'Table', {
      partitionKey: { name: 'postId', type: AttributeType.STRING },
    })

    baseTable.table.addGlobalSecondaryIndex({
      indexName: 'Created',
      partitionKey: {
        name: '_et',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: '_ct',
        type: AttributeType.STRING,
      },
    })

    this.table = baseTable.table
    
    new CfnOutput(this, 'PostTable', { key: 'PostTable', value: this.table.tableName })
  }
}