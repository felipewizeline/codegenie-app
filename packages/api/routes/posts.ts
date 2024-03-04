import { Router } from 'express'
import asyncify from 'express-asyncify'
import tryParseReq from '../try-parse-req'
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  ListPostsLastEvaluatedKey,
} from '../controllers/post'
import type { Filter } from '@/common/filter'

const postRouter = asyncify(Router({ mergeParams: true }))

postRouter.get('/posts', async (req, res) => {
  const lastEvaluatedKeyParsed: ListPostsLastEvaluatedKey | undefined = tryParseReq({ req, res, key: 'lastEvaluatedKey' })
  const filterParsed: Filter | undefined = tryParseReq({ req, res, key: 'filter' })
  const posts = await listPosts({
    lastEvaluatedKey: lastEvaluatedKeyParsed,
    filter: filterParsed,
  })

  res.json(posts)
})

postRouter.get('/posts/:postId', async (req, res) => {
  const { postId } = req.params
  const post = await getPost({
    postId,
  })

  if (!post) {
    return res
      .status(404)
      .json({})
  }

  return res.json(post)
})

postRouter.post('/posts', async (req, res) => {
  const { post } = req.body
  const createdPost = await createPost({
    post,
    currentUserId: req.cognitoUser.userId,
  })

  res.json(createdPost)
})

postRouter.put('/posts/:postId', async (req, res) => {
  const { postId } = req.params
  const { post } = req.body
  const postItem = await updatePost({
    postId,
    post,
  })

  res.json({ data: postItem })
})

postRouter.delete('/posts/:postId', async (req, res) => {
  const { postId } = req.params
  const result = await deletePost({
    postId,
  })

  if (!result) {
    return res
      .status(404)
      .json({})
  }

  return res.json({})
})

export default postRouter
