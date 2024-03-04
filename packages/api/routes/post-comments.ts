import { Router } from 'express'
import asyncify from 'express-asyncify'
import tryParseReq from '../try-parse-req'
import {
  listComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  ListCommentsLastEvaluatedKey,
} from '../controllers/comment'
import type { Filter } from '@/common/filter'

const commentRouter = asyncify(Router({ mergeParams: true }))

commentRouter.get('/posts/:postId/comments', async (req, res) => {
  const { postId } = req.params
  const lastEvaluatedKeyParsed: ListCommentsLastEvaluatedKey | undefined = tryParseReq({ req, res, key: 'lastEvaluatedKey' })
  const filterParsed: Filter | undefined = tryParseReq({ req, res, key: 'filter' })
  const comments = await listComments({
    lastEvaluatedKey: lastEvaluatedKeyParsed,
    filter: filterParsed,
    postId,
  })

  res.json(comments)
})

commentRouter.get('/posts/:postId/comments/:commentId', async (req, res) => {
  const { postId, commentId } = req.params
  const comment = await getComment({
    postId,
    commentId,
  })

  if (!comment) {
    return res
      .status(404)
      .json({})
  }

  return res.json(comment)
})

commentRouter.post('/posts/:postId/comments', async (req, res) => {
  const { comment } = req.body
  const { postId } = req.params
  const createdComment = await createComment({
    postId,
    comment,
    currentUserId: req.cognitoUser.userId,
  })

  res.json(createdComment)
})

commentRouter.put('/posts/:postId/comments/:commentId', async (req, res) => {
  const { postId, commentId } = req.params
  const { comment } = req.body
  const commentItem = await updateComment({
    postId,
    commentId,
    comment,
  })

  res.json({ data: commentItem })
})

commentRouter.delete('/posts/:postId/comments/:commentId', async (req, res) => {
  const { postId, commentId } = req.params
  const result = await deleteComment({
    postId,
    commentId,
  })

  if (!result) {
    return res
      .status(404)
      .json({})
  }

  return res.json({})
})

export default commentRouter
