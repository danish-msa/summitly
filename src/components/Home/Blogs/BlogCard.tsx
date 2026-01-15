import { ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  blog: {
    id: number;
    date: string;
    title: string;
    excerpt: string;
    image: string;
    category?: string;
    author?: string;
    readTime?: string;
  };
};

const BlogCard = ({ blog }: Props) => {
  // Format date to "22 Jan 2024" format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <Link href={`/blog/${blog.id}`}>
      <div className="group overflow-hidden bg-white rounded-t-3xl rounded-b-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-b-2 border-dotted border-secondary/30">
        {/* Image Container */}
        <div className="relative h-64 overflow-hidden rounded-t-3xl">
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Pre-construction Badge */}
          <div className="absolute top-4 left-4 bg-secondary/90 backdrop-blur-sm text-white rounded-full px-3 py-1.5 shadow-md z-10">
            <span className="text-xs font-semibold">Pre-construction</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {blog.author && (
              <>
                <span>{blog.author}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              </>
            )}
            <span>{formatDate(blog.date)}</span>
            {blog.readTime && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{blog.readTime} min read</span>
                </div>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground leading-tight line-clamp-2">
            {blog.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {blog.excerpt}
          </p>

          {/* Read More Link */}
          <div className="pt-2">
            <span className="text-sm font-medium text-secondary group-hover:gap-2 inline-flex items-center gap-1.5 transition-all duration-300">
              Read More
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;