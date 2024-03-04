'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Button,
  List,
} from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useListPostsQuery } from './postHooks'
import PostData from './PostData'
import PostUpsertModal from './PostUpsertModal'
import PostDeleteModal from './PostDeleteModal'
import { usePages } from '../../lib/usePages'
import { DEFAULT_PAGE_SIZE } from '../../../common/pagination'

export default function PostsList() {
  const [selectedForEdit, setSelectedForEdit] = useState<any|null>()
  const [selectedForDelete, setSelectedForDelete] = useState<any|null>()
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [previousPage, setPreviousPage] = useState<any|null>()
  const listPostsQuery = useListPostsQuery({ page: currentPageIndex, lastEvaluatedKey: previousPage?.lastEvaluatedKey })
  const posts = listPostsQuery?.data?.data
  const { pages, totalPagedItemsPlusOneIfHasMorePages } = usePages({
    items: posts,
    lastEvaluatedKey: listPostsQuery?.data?.lastEvaluatedKey,
    currentPageIndex,
  })

  function onPaginate(pageNumber) {
    const pageNumberIndex = pageNumber - 1
    setPreviousPage(pages[pageNumberIndex - 1])
    setCurrentPageIndex(pageNumberIndex)
  }

  return (
    <>
      <PostUpsertModal
        isOpen={Boolean(selectedForEdit)}
        setIsOpen={() => setSelectedForEdit(null)}
        post={selectedForEdit}
      />
      <PostDeleteModal
        onDelete={() => setSelectedForDelete(null)}
        onCancel={() => setSelectedForDelete(null)}
        post={selectedForDelete}
      />
      <List
        loading={listPostsQuery.isLoading}
        itemLayout='vertical'
        dataSource={posts}
        pagination={{
          pageSize: DEFAULT_PAGE_SIZE,
          onChange: onPaginate, total: totalPagedItemsPlusOneIfHasMorePages,
        }}
        renderItem={(post) => (
          <List.Item
            key={post.postId}
            actions={[
              <Button
                key='edit'
                icon={<EditOutlined />}
                onClick={() => setSelectedForEdit(post)}
              />, <Button
                key='delete'
                icon={<DeleteOutlined />}
                onClick={() => setSelectedForDelete(post)}
                danger
              />,
            ]}
          >
            <List.Item.Meta
              title={<CardTitle
                post={post}
                postId={post.postId}
              />}
            />
            <PostData post={post} />
          </List.Item>
        )}
      />
    </>
  )
}

function CardTitle({ post, postId }) {
  const title = post.title || postId

  return <div 
    style={{
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      maxWidth: '100%',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <Link href={`/posts/${postId}`}>{title}</Link>
  </div>
}