'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notification } from 'antd'
import axios from 'axios'
import type { Filter } from '@/common/filter'

interface ListPostCommentsParams {
  postId: string
  lastEvaluatedKey?: string
  filter?: Filter
}

const api = {
  listPostComments: ({ postId, lastEvaluatedKey, filter }: ListPostCommentsParams) => axios.get(`/posts/${postId}/comments`, {
    params: {
      lastEvaluatedKey,
      filter,
    },
  }),
  getPostComment: ({ postId, commentId }) => axios.get(`/posts/${postId}/comments/${commentId}`),
  createPostComment: ({ postId, data }) => axios.post(`/posts/${postId}/comments`, { comment: data }),
  updatePostComment: ({ postId, commentId, data }) => axios.put(`/posts/${postId}/comments/${commentId}`, { comment: data }),
  deletePostComment: ({ postId, commentId }) => axios.delete(`/posts/${postId}/comments/${commentId}`),
}

interface UseListPostCommentsQueryParams {
  page?: number
  lastEvaluatedKey?: string
  postId: string
}

interface ListPostCommentsApiResponse {
  data: PostCommentData[]
  lastEvaluatedKey: string
}

export interface PostCommentData {
  [k: string]: any
}

export function useListPostCommentsQuery({ page, lastEvaluatedKey, postId }: UseListPostCommentsQueryParams) {
  const listPostCommentsQuery = useQuery<ListPostCommentsApiResponse>(['postComments', postId, page], async () => {
    const apiResponse = await api.listPostComments({ lastEvaluatedKey, postId })
    return apiResponse.data
  }, {
    keepPreviousData: true,
  })

  return listPostCommentsQuery
}

export function useGetPostCommentQuery({ postId, commentId }) {
  const getPostCommentQuery = useQuery(['postComments', postId, commentId], async () => {
    const apiResponse = await api.getPostComment({ postId, commentId })
    return apiResponse.data
  }, {
    enabled: Boolean(postId && commentId),
  })

  return getPostCommentQuery
}

export function useCreatePostCommentMutation() {
  const queryClient = useQueryClient()
  const createPostCommentMutation = useMutation<any, any, any>(async ({ postId, data }) => {
    try {
      const response = await api.createPostComment({ postId, data })

      await queryClient.invalidateQueries(['postComments', postId])
      return response
    } catch (error: any) {
      notification.error({
        message: 'Create failed',
        description: error?.response?.data?.message || error?.message || 'Unknown error',
        placement: 'topRight',
      })
    }
  })

  return createPostCommentMutation
}

export function useUpdatePostCommentMutation() {
  const queryClient = useQueryClient()
  const updatePostCommentMutation = useMutation<any, any, any>(async ({ postId, commentId, data }) => {
    try {
      const response = await api.updatePostComment({ postId, commentId, data })

      await Promise.all([
        queryClient.invalidateQueries(['postComments', postId]),
        queryClient.invalidateQueries(['postComments', postId, commentId]),
      ])

      return response
    } catch (error: any) {
      notification.error({
        message: 'Update failed',
        description: error?.response?.data?.message || error?.message || 'Unknown error',
        placement: 'topRight',
      })
    }
  })

  return updatePostCommentMutation
}

export function useDeletePostCommentMutation() {
  const queryClient = useQueryClient()
  const deletePostCommentMutation = useMutation<any, any, any>(async ({ postId, commentId }) => {
    try {
      const response = await api.deletePostComment({ postId, commentId })

      await Promise.all([
        queryClient.invalidateQueries(['postComments', postId]),
        queryClient.invalidateQueries(['postComments', postId, commentId]),
      ])

      return response
    } catch (error: any) {
      notification.error({
        message: 'Delete failed',
        description: error?.response?.data?.message || error?.message || 'Unknown error',
        placement: 'topRight',
      })
    }
  })

  return deletePostCommentMutation
}
