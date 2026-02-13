import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/data/types";

interface BlogCardProps extends BlogPost {
  onClick?: () => void;
}

const BlogCard = ({
  id,
  image,
  date,
  title,
  excerpt,
  tags,
  large = false,
  readTime,
  onClick,
}: BlogCardProps) => {
  const href = `/news?id=${id}`;

  return (
    <article
      className={`group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md ${large ? "lg:col-span-1" : ""}`}
      onClick={onClick}
    >
      <Link
        href={href}
        className="flex flex-row gap-4 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <div
          className={`relative shrink-0 overflow-hidden rounded-lg bg-zinc-100 ${
            large ? "h-28 w-28 md:h-32 md:w-32" : "h-20 w-20 sm:h-24 sm:w-24"
          }`}
        >
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes={large ? "128px" : "96px"}
          />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <h3
            className={`font-semibold leading-tight text-zinc-900 line-clamp-2 transition-colors group-hover:text-primary ${
              large ? "text-lg md:text-xl" : "text-base"
            }`}
          >
            {title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-sm text-zinc-500">
            <span>{date}</span>
            {readTime && (
              <>
                <span aria-hidden="true">·</span>
                <span>{readTime}</span>
              </>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-primary">See details</p>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
