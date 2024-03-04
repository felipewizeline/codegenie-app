'use client'

import React, { useState } from 'react'
import {
  Button,
  Card,
  Skeleton,
  Space,
} from 'antd'
import PostCommentUpsertModal from './PostCommentUpsertModal'
import PostCommentData from './PostCommentData'
import AvatarNameLink from '../AvatarNameLink'

export default function PostCommentDetails({
  postId,
  postComment,
}) {
  return (
    <Space size='large' direction='vertical' style={{width: '100%'}}>
      <PostCommentDetailsDetails
        postId={postId}
        postComment={postComment}
      />
    </Space>
  )
}

function PostCommentDetailsDetails({
  postId,
  postComment,
}) {
  const [isUpsertModalVisible, setIsUpsertModalVisible] = useState(false)
  if (!postComment) return <Skeleton />

  function showUpsertModal() {
    setIsUpsertModalVisible(true)
  }

  return (
    <Card
      bordered={false}
      title={postComment.user?.name}
      extra={(
        <Button type='primary' onClick={showUpsertModal}>
          Edit
        </Button>
      )}
    >
      <PostCommentUpsertModal
        isOpen={isUpsertModalVisible}
        setIsOpen={setIsUpsertModalVisible}
        postComment={postComment}
        postId={postId}
      />
      <PostCommentData postComment={postComment} />
    </Card>
  )
}
