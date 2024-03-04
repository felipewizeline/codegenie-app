'use client'

import React from 'react'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'

export default function PostCommentData({ postComment, minColSpan = 12 }){
  const colSpans = {
    xs: Math.max(minColSpan, 24),
    sm: Math.max(minColSpan, 12),
    xl: Math.max(minColSpan, 8),
  }
  return <Row gutter={[48, 24]}>
    <Col {...colSpans}>
      <div><strong>Created</strong></div>
      <div>{postComment.created ? dayjs(postComment.created).format('D MMM \'YY') : ''}</div>
    </Col>
    <Col {...colSpans}>
      <div><strong>Parent</strong></div>
      <div>{postComment.parentId}</div>
    </Col>
    <Col {...colSpans}>
      <div><strong>Upvotes</strong></div>
      <div>{postComment.upvotes}</div>
    </Col>
    <Col xs={24}>
      <div><strong>Comment</strong></div>
      <div style={{whiteSpace: 'pre-line'}}>{postComment.comment}</div>
    </Col>
  </Row>
}
