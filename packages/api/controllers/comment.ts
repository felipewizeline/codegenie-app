import { Filter } from '@/common/filter'
import Comment from '../models/Comment'
import User, { UserTable } from '../models/User'
import { generateId } from '../utils/id'
import { log } from '../utils/logger'
import { dynamoCreateItem, getAttributesWithout } from '../utils/dynamodb'
import { DEFAULT_PAGE_SIZE } from '../../common/pagination'

const READ_ONLY_ATTRIBUTES = [
  'userId',
  'postId',
  'commentId',
  'parentId',
  'upvotes',
]
const IMMUTABLE_ATTRIBUTES = [
  ...READ_ONLY_ATTRIBUTES,
]

export async function createComment({
  comment,
  postId,
  commentId = comment.commentId || generateId(),
  currentUserId,
}) {
  const attributes = getAttributesWithout({ attributes: comment, without: READ_ONLY_ATTRIBUTES })
  attributes.postId = postId
  attributes.commentId = commentId
  attributes.userId = currentUserId

  await dynamoCreateItem({
    entity: Comment,
    attributes,
  })

  log.info('COMMENT_CONTROLLER:COMMENT_CREATED', { attributes })

  return { data: attributes }
}

export async function updateComment({
  postId,
  commentId,
  comment,
}) {
  const attributes = getAttributesWithout({ attributes: comment, without: IMMUTABLE_ATTRIBUTES })
  attributes.postId = postId
  attributes.commentId = commentId
  const commentItem = await Comment.update(attributes, { returnValues: 'ALL_NEW' })

  log.info('COMMENT_CONTROLLER:COMMENT_UPDATED', { commentItem })

  return commentItem.Attributes
}

export async function getComment({
  postId,
  commentId,
}) {
  const comment = await Comment.get({ postId, commentId })
  const commentItem = comment?.Item

  if (!commentItem) return null

  const data = commentItem
  const user = commentItem.userId ? await User.get({ userId: commentItem.userId }) : null
  
  // @ts-ignore
  data.user = user?.Item

  return { data }
}

export interface ListCommentsLastEvaluatedKey {
  postId: string
}

interface ListCommentsParams {
  lastEvaluatedKey?: ListCommentsLastEvaluatedKey
  filter?: Filter
  postId: string
}

export async function listComments({
  lastEvaluatedKey,
  filter,
  postId,
}: ListCommentsParams) {
  const commentQueryResponse = await Comment.query(postId, { limit: DEFAULT_PAGE_SIZE, startKey: lastEvaluatedKey })
  const commentQueryResponseItems = commentQueryResponse?.Items || []
  const commentsUserIds = commentQueryResponseItems.map(comment => comment.userId).filter(Boolean)

  if (!commentsUserIds.length) {
    return {
      data: commentQueryResponseItems,
      lastEvaluatedKey: commentQueryResponse.LastEvaluatedKey,
    }
  }

  const uniqueCommentsUserIds = Array.from(new Set(commentsUserIds))
  const commentsUsersBatchGetOperations = uniqueCommentsUserIds.map(commentUserId => User.getBatch({ userId: commentUserId }))

  const commentsUsers = commentsUsersBatchGetOperations.length ? await UserTable.batchGet(commentsUsersBatchGetOperations) : null

  const comments = commentQueryResponseItems.map(comment => {
    const user = comment.userId ? commentsUsers?.Responses[UserTable.name].find(commentUser => commentUser.userId === comment.userId) : null

    return {
      ...comment,
      user,
    }
  })

  return {
    data: comments,
    lastEvaluatedKey: commentQueryResponse.LastEvaluatedKey,
  }
}

export async function deleteComment({
  postId,
  commentId,
}) {
  const itemToDeleteKey = { postId, commentId }

  const comment = await Comment.get(itemToDeleteKey)

  if (!comment) return null

  return Comment.delete(itemToDeleteKey)
}
