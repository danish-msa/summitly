import BlogCard from "./BlogCard";
import { getRecentBlogPosts } from "@/data/data";

const RecentPosts = () => {
  const recentPosts = getRecentBlogPosts(5);

  return (
    <section className="max-w-[1400px] mx-auto px-4 py-16 md:px-8">
      <h2 className="mb-8 text-2xl font-semibold">Recent blog posts</h2>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <BlogCard {...recentPosts[0]} />
        
        <div className="grid gap-8 sm:grid-cols-2">
          {recentPosts.slice(1).map((post) => (
            <BlogCard key={post.id} {...post} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentPosts;
