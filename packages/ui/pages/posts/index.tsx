'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { Breadcrumb, Button } from 'antd'
import { HomeOutlined, AppstoreOutlined } from '@ant-design/icons'
import PostsList from '@/components/Post/PostsList'
import PostUpsertModal from '@/components/Post/PostUpsertModal'
import getPageTitle from '@/ui/lib/getPageTitle'
import AuthenticatedPage from '@/ui/components/layouts/AuthenticatedPage'

export default function PostsMasterPage() {
  const [isUpsertModalVisible, setIsUpsertModalVisible] = useState(false)

  function showUpsertModal() {
    setIsUpsertModalVisible(true)
  }

  return (
    <AuthenticatedPage>
      <Head>
        <title>{getPageTitle({ pageTitle: 'Posts' })}</title>
      </Head>
      <Breadcrumb items={[
        {
          title: <Link href='/' passHref><HomeOutlined /></Link>,
        },
        {
          title: <>
            <AppstoreOutlined />
            <span>Posts</span>
          </>,
        },
      ]} />
      <div className='toolbar'>
        <Button type='primary' onClick={showUpsertModal}>
          Create Post
        </Button>
      </div>
      <PostUpsertModal
        isOpen={isUpsertModalVisible}
        setIsOpen={setIsUpsertModalVisible}
      />
      <PostsList />
      <style jsx>
        {`
        .toolbar {
          margin-bottom: 1rem;
        }
        `}
      </style>
    </AuthenticatedPage>
  )
}
