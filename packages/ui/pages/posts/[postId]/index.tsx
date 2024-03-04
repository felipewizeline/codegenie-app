'use client'

import React from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Breadcrumb } from 'antd'
import { HomeOutlined, AppstoreOutlined } from '@ant-design/icons'
import PostDetails from '@/components/Post/PostDetails'
import { useGetPostQuery } from '@/components/Post/postHooks'
import getPageTitle from '@/ui/lib/getPageTitle'
import AuthenticatedPage from '@/ui/components/layouts/AuthenticatedPage'

export default function PostsDetailsPage() {
  const router = useRouter()
  const {
    postId,
  } = router.query
  const getPostQuery = useGetPostQuery({ postId })

  const post = getPostQuery.data?.data

  return (
    <AuthenticatedPage>
      <Head>
        <title>{getPageTitle({ pageTitle: post ? `${post.title} | Post` : 'Post' })}</title>
      </Head>
      <Breadcrumb items={[
        {
          title: <Link href='/' passHref><HomeOutlined /></Link>,
        },
        {
          title: <Link href='/posts' passHref>
            <AppstoreOutlined />{' '}Posts
          </Link>,
        },
        {
          title: post?.title || post?.postId,
        },
      ]} />
      <div className='detailsContainer'>
        <PostDetails
          post={post}
        />
      </div>
      <style jsx>
        {`
        .detailsContainer {
          margin-top: 1rem;
        }
        `}
      </style>
    </AuthenticatedPage>
  )
}
