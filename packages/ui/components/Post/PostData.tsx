'use client'

import React from 'react'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import AvatarNameLink from '../AvatarNameLink'

export default function PostData({ post, minColSpan = 8 }){
  const colSpans = {
    xs: Math.max(minColSpan, 24),
    sm: Math.max(minColSpan, 12),
    xl: Math.max(minColSpan, 8),
  }
  return <Row gutter={[48, 24]}>
    <Col {...colSpans}>
      <div><strong>Created</strong></div>
      <div>{post.created ? dayjs(post.created).format('D MMM \'YY') : ''}</div>
    </Col>
    <Col {...colSpans}>
      <div><strong>User</strong></div>
      <div>
        <AvatarNameLink
          name={post.user?.name}
          image={post.user?.avatar}
          imageAlt='avatar'
          linkRoute={`/users/${post.user?.userId}`}
        />
      </div>
    </Col>
    <Col {...colSpans}>
      <div><strong>Url</strong></div>
      <div><a href={post.url} target='_blank' rel='noopener'>{post.url}</a></div>
    </Col>
    <Col {...colSpans}>
      <div><strong>Upvotes</strong></div>
      <div>{post.upvotes}</div>
    </Col>
    <Col xs={24}>
      <div><strong>Comment</strong></div>
      <div style={{whiteSpace: 'pre-line'}}>{post.comment}</div>
    </Col>
  </Row>
}
