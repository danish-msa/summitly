import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Props = {
  blog: {
    id: number;
    date: string;
    title: string;
    excerpt: string;
    image: string;
    category?: string;
    author: string;
  };
};

const BlogCard = ({ blog }: Props) => {
  return (
    <Card className="group overflow-hidden border-0 bg-card shadow-blog-card hover:shadow-blog-card-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer">
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Date Badge */}
        <div className="absolute top-4 left-4 bg-brand-glacier/95 backdrop-blur-sm text-black rounded-full px-4 py-2 flex items-center gap-2 shadow-lg z-10">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">{blog.date}</span>
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        {/* Category Badge */}
        {blog.category && (
          <Badge variant="secondary" className="text-xs font-semibold">
            {blog.category}
          </Badge>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
          {blog.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {blog.excerpt}
        </p>

        {/* Read More Link */}
        <div className="pt-2">
          <span className="text-sm font-semibold text-primary group-hover:gap-2 inline-flex items-center gap-1 transition-all duration-300">
            Read More
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </Card>
  );
};

export default BlogCard;