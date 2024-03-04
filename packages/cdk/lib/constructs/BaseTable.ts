import { Construct } from 'constructs'
import { Table, Attribute, BillingMode } from 'aws-cdk-lib/aws-dynamodb'
import { getRemovalPolicy, getIsDeletionProtectionEnabled, getIsPointInTimeRecoveryEnabled } from '../environment-config'


interface BaseTableProps {
  partitionKey: Attribute
  sortKey?: Attribute
}

export default class BaseTable extends Construct {
  public readonly table: Table

  constructor(scope: Construct, id: string, props: BaseTableProps) {
    super(scope, id)

    this.table = new Table(this, 'Table', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      deletionProtection: getIsDeletionProtectionEnabled({ node: this.node }),
      removalPolicy: getRemovalPolicy({ node: this.node }),
      pointInTimeRecovery: getIsPointInTimeRecoveryEnabled({ node: this.node }),
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
    })
  }
}