'use client'

import React, { useState } from 'react'
import {
  Button,
  List,
} from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useListPostCommentsQuery } from './postCommentHooks'
import PostCommentData from './PostCommentData'
import PostCommentUpsertModal from './PostCommentUpsertModal'
import PostCommentDeleteModal from './PostCommentDeleteModal'
import { usePages } from '../../lib/usePages'
import { DEFAULT_PAGE_SIZE } from '../../../common/pagination'

export default function PostCommentsList({
  postId,
}) {
  const [selectedForEdit, setSelectedForEdit] = useState<any|null>()
  const [selectedForDelete, setSelectedForDelete] = useState<any|null>()
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [previousPage, setPreviousPage] = useState<any|null>()
  const listPostCommentsQuery = useListPostCommentsQuery({ page: currentPageIndex, lastEvaluatedKey: previousPage?.lastEvaluatedKey, postId })
  const postComments = listPostCommentsQuery?.data?.data
  const { pages, totalPagedItemsPlusOneIfHasMorePages } = usePages({
    items: postComments,
    lastEvaluatedKey: listPostCommentsQuery?.data?.lastEvaluatedKey,
    currentPageIndex,
  })

  function onPaginate(pageNumber) {
    const pageNumberIndex = pageNumber - 1
    setPreviousPage(pages[pageNumberIndex - 1])
    setCurrentPageIndex(pageNumberIndex)
  }

  return (
    <>
      <PostCommentUpsertModal
        isOpen={Boolean(selectedForEdit)}
        setIsOpen={() => setSelectedForEdit(null)}
        postComment={selectedForEdit}
        postId={postId}
      />
      <PostCommentDeleteModal
        onDelete={() => setSelectedForDelete(null)}
        onCancel={() => setSelectedForDelete(null)}
        postComment={selectedForDelete}
      />
      <List
        loading={listPostCommentsQuery.isLoading}
        itemLayout='vertical'
        dataSource={postComments}
        pagination={{
          pageSize: DEFAULT_PAGE_SIZE,
          onChange: onPaginate, total: totalPagedItemsPlusOneIfHasMorePages,
        }}
        renderItem={(postComment) => (
          <List.Item
            key={postComment.commentId}
            actions={[
              <Button
                key='edit'
                icon={<EditOutlined />}
                onClick={() => setSelectedForEdit(postComment)}
              />, <Button
                key='delete'
                icon={<DeleteOutlined />}
                onClick={() => setSelectedForDelete(postComment)}
                danger
              />,
            ]}
          >
            <List.Item.Meta
              title={<CardTitle
                postComment={postComment}
                commentId={postComment.commentId}
              />}
            />
            <PostCommentData postComment={postComment} />
          </List.Item>
        )}
      />
    </>
  )
}

function CardTitle({ postComment, commentId }) {
  const title = postComment.user?.name || commentId

  return <div 
    style={{
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      maxWidth: '100%',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    {title}
  </div>
}