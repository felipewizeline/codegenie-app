'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notification } from 'antd'
import axios from 'axios'
import type { Filter } from '@/common/filter'

interface ListPostsParams {
  lastEvaluatedKey?: string
  filter?: Filter
}

const api = {
  listPosts: ({ lastEvaluatedKey, filter }: ListPostsParams = {}) => axios.get('/posts', {
    params: {
      lastEvaluatedKey,
      filter,
    },
  }),
  getPost: ({ postId }) => axios.get(`/posts/${postId}`),
  createPost: ({ data }) => axios.post('/posts', { post: data }),
  updatePost: ({ postId, data }) => axios.put(`/posts/${postId}`, { post: data }),
  deletePost: ({ postId }) => axios.delete(`/posts/${postId}`),
}

interface UseListPostsQueryParams {
  page?: number
  lastEvaluatedKey?: string
}

interface ListPostsApiResponse {
  data: PostData[]
  lastEvaluatedKey: string
}

export interface PostData {
  [k: string]: any
}

export function useListPostsQuery({ page, lastEvaluatedKey }: UseListPostsQueryParams) {
  const listPostsQuery = useQuery<ListPostsApiResponse>(['posts', page], async () => {
    const apiResponse = await api.listPosts({ lastEvaluatedKey })
    return apiResponse.data
  }, {
    keepPreviousData: true,
  })

  return listPostsQuery
}

interface UseSearchPostsQueryParams {
  title?: string
  lastEvaluatedKey?: string
}

export function useSearchPostsQuery({ title, lastEvaluatedKey }: UseSearchPostsQueryParams) {
  const searchPostsQuery = useQuery(['searchPosts', title, lastEvaluatedKey], async () => {
    const filter = title ? {
      filters: [{
        property: 'title',
        value: title,
      }],
    } : undefined
    const apiResponse = await api.listPosts({ lastEvaluatedKey, filter })
    return apiResponse.data
  },
  {
    keepPreviousData: true,
    staleTime: 30000, // 30s
  })

  return searchPostsQuery
}

export function useGetPostQuery({ postId }) {
  const getPostQuery = useQuery(['posts', postId], async () => {
    const apiResponse = await api.getPost({ postId })
    return apiResponse.data
  }, {
    enabled: Boolean(postId),
  })

  return getPostQuery
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient()
  const createPostMutation = useMutation<any, any, any>(async ({ data }) => {
    try {
      const response = await api.createPost({ data })

      await queryClient.invalidateQueries(['posts'])
      return response
    } catch (error: any) {
      notification.error({
        message: 'Create failed',
        description: error?.response?.data?.message || error?.message || 'Unknown error',
        placement: 'topRight',
      })
    }
  })

  return createPostMutation
}

export function useUpdatePostMutation() {
  const queryClient = useQueryClient()
  const updatePostMutation = useMutation<any, any, any>(async ({ postId, data }) => {
    try {
      const response = await api.updatePost({ postId, data })

      await Promise.all([
        queryClient.invalidateQueries(['posts']),
        queryClient.invalidateQueries(['posts', postId]),
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

  return updatePostMutation
}

export function useDeletePostMutation() {
  const queryClient = useQueryClient()
  const deletePostMutation = useMutation<any, any, any>(async ({ postId }) => {
    try {
      const response = await api.deletePost({ postId })

      await Promise.all([
        queryClient.invalidateQueries(['posts']),
        queryClient.invalidateQueries(['posts', postId]),
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

  return deletePostMutation
}
