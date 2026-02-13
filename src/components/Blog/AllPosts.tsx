import BlogCard from "./BlogCard";
import { getPaginatedBlogPosts } from "@/data/data";
import { BlogFilters } from "@/data/types";

interface AllPostsProps {
  currentPage: number;
  postsPerPage: number;
  filters: BlogFilters;
}

const AllPosts = ({ currentPage, postsPerPage, filters }: AllPostsProps) => {
  const paginatedData = getPaginatedBlogPosts(filters, currentPage, postsPerPage);

  return (
    <section className="max-w-[1400px] mx-auto px-4 pb-16 md:px-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold">All blog posts</h2>
        <p className="text-muted-foreground">
          Showing {paginatedData.posts.length} of {paginatedData.totalPosts} posts
        </p>
      </div>
      
      {paginatedData.posts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {paginatedData.posts.map((post) => (
            <BlogCard key={post.id} {...post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No blog posts found matching your criteria.</p>
        </div>
      )}
    </section>
  );
};

export default AllPosts;
