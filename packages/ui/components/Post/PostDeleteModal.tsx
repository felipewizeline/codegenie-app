'use client'

import React from 'react'
import { Modal } from 'antd'
import { useDeletePostMutation } from './postHooks'

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

export default function PostDeleteModal({ post, onCancel, onDelete }) {
  const deleteMutation = useDeletePostMutation()

  async function onDeleteButtonClick() {
    const postId = post.postId
    await deleteMutation.mutateAsync({ postId })
    onDelete()
  }

  return (
    <DeleteModal
      isOpen={post}
      entityName='Post'
      name={post?.title}
      isLoading={deleteMutation.isLoading}
      onDeleteButtonClick={onDeleteButtonClick}
      onCancel={onCancel}
    />
  )
}
