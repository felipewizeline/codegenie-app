'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Button,
  Form,
  Modal,
  Input,
} from 'antd'
import { useCreatePostCommentMutation, useUpdatePostCommentMutation } from './postCommentHooks'

const DEFAULT_VALUES = {
}

interface PostCommentUpsertModalParams {
  isOpen: boolean
  postComment?: any
  postId: any
  setIsOpen: any
}

export default function PostCommentUpsertModal({
  isOpen,
  postComment,
  postId,
  setIsOpen,
}: PostCommentUpsertModalParams) {
  const postCommentMutation = postComment ? useUpdatePostCommentMutation() : useCreatePostCommentMutation()

  function onCancel() {
    setIsOpen(false)
  }

  return (
    <Modal
      centered
      title='Comment'
      open={isOpen}
      destroyOnClose
      onCancel={onCancel}
      footer={[
        <Button
          key='cancel'
          disabled={postCommentMutation.isLoading}
          onClick={onCancel}
        >
          Cancel
        </Button>,
        <Button
          type='primary'
          form='comment'
          key='submit'
          htmlType='submit'
          loading={postCommentMutation.isLoading}
        >
          {postComment ? 'Update Comment' : 'Create Comment'}
        </Button>,
      ]}
    >
      <PostCommentUpsertForm
        postComment={postComment}
        postId={postId}
        onEdit={() => setIsOpen(false)}
        postCommentMutation={postCommentMutation}
      />
    </Modal>
  )
}

function PostCommentUpsertForm({
  postComment,
  postId,
  onEdit,
  postCommentMutation,
}) {
  const router = useRouter()
  const [commentForm] = Form.useForm()

  // When editing multiple records on the same page, we need to call resetFields,
  // otherwise the form lags behind, showing the previously selected record's values.
  // https://github.com/ant-design/ant-design/issues/22372
  useEffect(() => {
    commentForm.resetFields()
  }, [postComment])

  async function submitForm() {
    const formValues = await commentForm.validateFields()
    const { commentId } = postComment || {}

    const response = postComment ? await postCommentMutation.mutateAsync({
      postId,
      commentId,
      data: formValues,
    }) : await postCommentMutation.mutateAsync({
      postId,
      data: {
        ...formValues,
        postId,
      },
    })

    if (response) {
      onEdit()
    }
  }

  const initialValues = postComment ? {
    ...postComment,
  } : DEFAULT_VALUES

  return (
    <Form
      name='comment'
      preserve={false}
      initialValues={initialValues}
      form={commentForm}
      onFinish={submitForm}
      layout='vertical'
      disabled={postCommentMutation.isLoading}
    >
      <Form.Item
        label='Comment'
        name='comment'
        rules={[
          {
            required: true,
            message: 'Please enter comment.',
          },
        ]}
      >
        <Input.TextArea showCount autoSize={{ minRows: 2 }} />
      </Form.Item>
    </Form>
  )
}
