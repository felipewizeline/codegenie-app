import * as DynamoDbToolbox from 'dynamodb-toolbox'
import { assertHasRequiredEnvVars } from '@/common/required-env-vars'
import { dynamoDbDocumentClient } from '../utils/dynamodb'
import { POST_TABLE } from '../config'

assertHasRequiredEnvVars(['POST_TABLE'])

export const PostTable = new DynamoDbToolbox.Table({
  name: POST_TABLE,
  partitionKey: 'postId',
  DocumentClient: dynamoDbDocumentClient,
  indexes: {
    Created: {
      partitionKey: '_et',
      sortKey: '_ct',
    },
  },
})

const Post = new DynamoDbToolbox.Entity({
  name: 'Post',
  attributes: {
    postId: {
      partitionKey: true,
    },
    userId: 'string',
    url: 'string',
    title: 'string',
    comment: 'string',
    upvotes: 'number',
  },
  table: PostTable,
})

export default Post
