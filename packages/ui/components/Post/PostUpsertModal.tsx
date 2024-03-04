'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Button,
  Form,
  Modal,
  Input,
} from 'antd'
import { useCreatePostMutation, useUpdatePostMutation } from './postHooks'

const DEFAULT_VALUES = {
}

interface PostUpsertModalParams {
  isOpen: boolean
  post?: any
  setIsOpen: any
}

export default function PostUpsertModal({
  isOpen,
  post,
  setIsOpen,
}: PostUpsertModalParams) {
  const postMutation = post ? useUpdatePostMutation() : useCreatePostMutation()

  function onCancel() {
    setIsOpen(false)
  }

  return (
    <Modal
      centered
      title='Post'
      open={isOpen}
      destroyOnClose
      onCancel={onCancel}
      footer={[
        <Button
          key='cancel'
          disabled={postMutation.isLoading}
          onClick={onCancel}
        >
          Cancel
        </Button>,
        <Button
          type='primary'
          form='post'
          key='submit'
          htmlType='submit'
          loading={postMutation.isLoading}
        >
          {post ? 'Update Post' : 'Create Post'}
        </Button>,
      ]}
    >
      <PostUpsertForm
        post={post}
        onEdit={() => setIsOpen(false)}
        postMutation={postMutation}
      />
    </Modal>
  )
}

function PostUpsertForm({
  post,
  onEdit,
  postMutation,
  shouldNavigateToDetailsPageOnCreate = true,
}) {
  const router = useRouter()
  const [postForm] = Form.useForm()

  // When editing multiple records on the same page, we need to call resetFields,
  // otherwise the form lags behind, showing the previously selected record's values.
  // https://github.com/ant-design/ant-design/issues/22372
  useEffect(() => {
    postForm.resetFields()
  }, [post])

  async function submitForm() {
    const formValues = await postForm.validateFields()
    let { postId } = post || {}

    const response = post ? await postMutation.mutateAsync({
      postId,
      data: formValues,
    }) : await postMutation.mutateAsync({
      data: {
        ...formValues,
      },
    })

    if (response) {
      if (!post && shouldNavigateToDetailsPageOnCreate) {
        postId = response.data.data.postId
        router.push(`/posts/${postId}`)
      } else {
        onEdit()
      }
    }
  }

  const initialValues = post ? {
    ...post,
  } : DEFAULT_VALUES

  return (
    <Form
      name='post'
      preserve={false}
      initialValues={initialValues}
      form={postForm}
      onFinish={submitForm}
      layout='vertical'
      disabled={postMutation.isLoading}
    >
      <Form.Item
        label='Title'
        name='title'
        rules={[
          {
            required: true,
            message: 'Please enter title.',
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label='Url'
        name='url'
        rules={[
          {
            required: true,
            message: 'Please enter url.',
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label='Comment'
        name='comment'
      >
        <Input.TextArea showCount autoSize={{ minRows: 2 }} />
      </Form.Item>
    </Form>
  )
}
