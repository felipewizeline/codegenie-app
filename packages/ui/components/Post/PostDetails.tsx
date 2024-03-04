'use client'

import React, { useState } from 'react'
import {
  Button,
  Card,
  Skeleton,
  Space,
} from 'antd'
import PostUpsertModal from './PostUpsertModal'
import PostData from './PostData'
import PostCommentsList from '../PostComment/PostCommentsList'
import PostCommentUpsertModal from '../PostComment/PostCommentUpsertModal'
import AvatarNameLink from '../AvatarNameLink'

export default function PostDetails({
  post,
}) {
  return (
    <Space size='large' direction='vertical' style={{width: '100%'}}>
      <PostDetailsDetails
        post={post}
      />
      <PostComments
        post={post}
      />
    </Space>
  )
}

function PostDetailsDetails({
  post,
}) {
  const [isUpsertModalVisible, setIsUpsertModalVisible] = useState(false)
  if (!post) return <Skeleton />

  function showUpsertModal() {
    setIsUpsertModalVisible(true)
  }

  return (
    <Card
      bordered={false}
      title={post.title}
      extra={(
        <Button type='primary' onClick={showUpsertModal}>
          Edit
        </Button>
      )}
    >
      <PostUpsertModal
        isOpen={isUpsertModalVisible}
        setIsOpen={setIsUpsertModalVisible}
        post={post}
      />
      <PostData post={post} />
    </Card>
  )
}

export function PostComments({
  post,
}) {
  const [isUpsertModalVisible, setIsUpsertModalVisible] = useState(false)

  if (!post) return <Skeleton />

  function showUpsertModal() {
    setIsUpsertModalVisible(true)
  }

  return (
    <Card
      bordered={false}
      title='Comments'
      extra={(
        <Button type='primary' onClick={showUpsertModal}>
          Create Comment
        </Button>
      )}
    >
      <PostCommentUpsertModal
        isOpen={isUpsertModalVisible}
        setIsOpen={setIsUpsertModalVisible}
        postId={post.postId}
      />
      <PostCommentsList
        postId={post.postId}
      />
    </Card>
  )
}
