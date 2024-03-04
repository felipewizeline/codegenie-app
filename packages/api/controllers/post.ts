import { Filter } from '@/common/filter'
import Post from '../models/Post'
import User, { UserTable } from '../models/User'
import { generateId } from '../utils/id'
import { log } from '../utils/logger'
import { dynamoCreateItem, getAttributesWithout, scanAll } from '../utils/dynamodb'
import { DEFAULT_PAGE_SIZE } from '../../common/pagination'

const READ_ONLY_ATTRIBUTES = [
  'postId',
  'userId',
  'upvotes',
]
const IMMUTABLE_ATTRIBUTES = [
  ...READ_ONLY_ATTRIBUTES,
]

export async function createPost({
  post,
  postId = generateId(),
  currentUserId,
}) {
  const attributes = getAttributesWithout({ attributes: post, without: READ_ONLY_ATTRIBUTES })
  attributes.postId = postId
  attributes.userId = currentUserId

  await dynamoCreateItem({
    entity: Post,
    attributes,
  })

  log.info('POST_CONTROLLER:POST_CREATED', { attributes })

  return { data: attributes }
}

export async function updatePost({
  postId,
  post,
}) {
  const attributes = getAttributesWithout({ attributes: post, without: IMMUTABLE_ATTRIBUTES })
  attributes.postId = postId
  const postItem = await Post.update(attributes, { returnValues: 'ALL_NEW' })

  log.info('POST_CONTROLLER:POST_UPDATED', { postItem })

  return postItem.Attributes
}

export async function getPost({
  postId,
}) {
  const post = await Post.get({ postId })
  const postItem = post?.Item

  if (!postItem) return null

  const data = postItem
  const user = postItem.userId ? await User.get({ userId: postItem.userId }) : null
  
  // @ts-ignore
  data.user = user?.Item

  return { data }
}

export interface ListPostsLastEvaluatedKey {
  postId: string
}

interface ListPostsParams {
  lastEvaluatedKey?: ListPostsLastEvaluatedKey
  filter?: Filter
  index?: string
}

export async function listPosts({
  lastEvaluatedKey,
  filter,
  index,
}: ListPostsParams = {}) {
  const postScanResponse = await scanAll({
    entity: Post,
    scanOptions: {
      startKey: lastEvaluatedKey,
      index,
    },
    maxItems: DEFAULT_PAGE_SIZE,
    maxPages: 10,
    filter,
  })
  const postScanResponseItems = postScanResponse?.Items || []
  const postsUserIds = postScanResponseItems.map(post => post.userId).filter(Boolean)

  if (!postsUserIds.length) {
    return {
      data: postScanResponseItems,
      lastEvaluatedKey: postScanResponse.LastEvaluatedKey,
    }
  }

  const uniquePostsUserIds = Array.from(new Set(postsUserIds))
  const postsUsersBatchGetOperations = uniquePostsUserIds.map(postUserId => User.getBatch({ userId: postUserId }))

  const postsUsers = postsUsersBatchGetOperations.length ? await UserTable.batchGet(postsUsersBatchGetOperations) : null

  const posts = postScanResponseItems.map(post => {
    const user = post.userId ? postsUsers?.Responses[UserTable.name].find(postUser => postUser.userId === post.userId) : null

    return {
      ...post,
      user,
    }
  })

  return {
    data: posts,
    lastEvaluatedKey: postScanResponse.LastEvaluatedKey,
  }
}

export async function deletePost({
  postId,
}) {
  const itemToDeleteKey = { postId }

  const post = await Post.get(itemToDeleteKey)

  if (!post) return null

  return Post.delete(itemToDeleteKey)
}
