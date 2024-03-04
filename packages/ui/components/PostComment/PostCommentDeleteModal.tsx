'use client'

import React from 'react'
import { Modal } from 'antd'
import { useDeletePostCommentMutation } from './postCommentHooks'

function DeleteModal({
  isOpen,
  entityName,
  name,
  isLoading,
  onDeleteButtonClick,
  onCancel,
}) {
  return (
    <Modal
      title={`Delete ${name}`}
      open={Boolean(isOpen)}
      okText={`Delete ${name}`}
      onOk={onDeleteButtonClick}
      onCancel={onCancel}
      okButtonProps={{
        loading: isLoading,
        danger: true,
      }}
    >
      Are you sure you want to delete the
      {' '}
      <strong>{entityName}</strong>
      :
      {' '}
      <strong>{name}</strong>
      ?
    </Modal>
  )
}

export default function PostCommentDeleteModal({ postComment, onCancel, onDelete }) {
  const deleteMutation = useDeletePostCommentMutation()

  async function onDeleteButtonClick() {
    const postId = postComment.postId
    await deleteMutation.mutateAsync({ postId, commentId: postComment.commentId })
    onDelete()
  }

  return (
    <DeleteModal
      isOpen={postComment}
      entityName='Comment'
      name={postComment?.user?.name}
      isLoading={deleteMutation.isLoading}
      onDeleteButtonClick={onDeleteButtonClick}
      onCancel={onCancel}
    />
  )
}
