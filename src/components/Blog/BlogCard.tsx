import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BlogPost } from "@/data/types";

interface BlogCardProps extends BlogPost {
  onClick?: () => void;
}

const BlogCard = ({ image, date, title, excerpt, tags, large = false, author, readTime, onClick }: BlogCardProps) => {
  return (
    <article 
      className={`group cursor-pointer ${large ? 'lg:col-span-1' : ''}`}
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={image}
          alt={title}
          width={large ? 800 : 400}
          height={large ? 600 : 300}
          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105 lg:h-64"
        />
      </div>
      
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>{date}</p>
          {readTime && <span>{readTime}</span>}
        </div>
        
        <h3 className={`font-semibold leading-tight transition-colors group-hover:text-primary ${large ? 'text-xl' : 'text-lg'}`}>
          {title}
        </h3>
        
        <p className="text-muted-foreground line-clamp-2">
          {excerpt}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
