import React from 'react'
import BlogSection from '@/components/common/BlogSection'

const PreConBlogs = () => {
  return (
    <BlogSection
      category="Pre-construction"
      heading="Pre-Construction Insights"
      subheading="Latest News"
      description="Stay informed with the latest news, tips, and insights about pre-construction properties in Canada"
      limit={3}
    />
  )
}

export default PreConBlogs

