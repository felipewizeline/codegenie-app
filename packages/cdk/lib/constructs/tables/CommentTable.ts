import { Construct } from 'constructs'
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { CfnOutput } from 'aws-cdk-lib'
import BaseTable from '../BaseTable'

export default class CommentTable extends Construct {
  public readonly table: Table

  constructor(scope: Construct, id: string) {
    super(scope, id)

    const baseTable = new BaseTable(this, 'Table', {
      partitionKey: { name: 'postId', type: AttributeType.STRING },
      sortKey: { name: 'commentId', type: AttributeType.STRING },
    })

    this.table = baseTable.table
    
    new CfnOutput(this, 'CommentTable', { key: 'CommentTable', value: this.table.tableName })
  }
}