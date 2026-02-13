import BlogCard from "./BlogCard";
import { getRecentBlogPosts } from "@/data/data";

const RecentPosts = () => {
  const recentPosts = getRecentBlogPosts(5);

  return (
    <section className="max-w-[1400px] mx-auto px-4 py-16 md:px-8">
      <h2 className="mb-8 text-2xl font-semibold">Recent blog posts</h2>
      
      <div className="flex flex-col gap-4">
        {recentPosts.map((post) => (
          <BlogCard key={post.id} {...post} large={post.id === recentPosts[0].id} />
        ))}
      </div>
    </section>
  );
};

export default RecentPosts;
