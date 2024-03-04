import * as DynamoDbToolbox from 'dynamodb-toolbox'
import { assertHasRequiredEnvVars } from '@/common/required-env-vars'
import { dynamoDbDocumentClient } from '../utils/dynamodb'
import { COMMENT_TABLE } from '../config'

assertHasRequiredEnvVars(['COMMENT_TABLE'])

export const CommentTable = new DynamoDbToolbox.Table({
  name: COMMENT_TABLE,
  partitionKey: 'postId',
  sortKey: 'commentId',
  DocumentClient: dynamoDbDocumentClient,
})

const Comment = new DynamoDbToolbox.Entity({
  name: 'Comment',
  attributes: {
    postId: {
      partitionKey: true,
    },
    commentId: {
      sortKey: true,
    },
    userId: 'string',
    comment: 'string',
    parentId: 'string',
    upvotes: 'number',
  },
  table: CommentTable,
})

export default Comment
