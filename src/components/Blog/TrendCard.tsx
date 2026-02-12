import Image from "next/image";
import Link from "next/link";

export interface TrendCardItem {
  category?: string;
  title: string;
  excerpt?: string;
  imageSrc: string;
  imageAlt: string;
  href?: string;
}

interface TrendCardProps {
  item: TrendCardItem;
  variant: "featured" | "compact";
}

const cardLinkClass =
  "group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const cardCompactLinkClass =
  "flex gap-4 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset";

export default function TrendCard({ item, variant }: TrendCardProps) {
  const contentFeatured = (
    <>
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={item.imageSrc}
          alt={item.imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="p-5 md:p-6">
        {item.category && (
          <span className="text-sm text-zinc-500">{item.category}</span>
        )}
        <h3 className="mt-1.5 text-xl font-bold leading-tight text-zinc-900 md:text-2xl">
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-700 line-clamp-2">
            {item.excerpt}
          </p>
        )}
      </div>
    </>
  );

  const contentCompact = (
    <>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg md:h-28 md:w-28">
        <Image
          src={item.imageSrc}
          alt={item.imageAlt}
          fill
          className="object-cover"
          sizes="112px"
        />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        {item.category && (
          <span className="text-sm text-zinc-500">{item.category}</span>
        )}
        <h3 className="mt-1 font-bold leading-tight text-zinc-900 line-clamp-3 md:text-base">
          {item.title}
        </h3>
      </div>
    </>
  );

  if (variant === "featured") {
    return (
      <article className="overflow-hidden rounded-xl bg-white shadow-sm">
        {item.href ? (
          <Link href={item.href} className={cardLinkClass}>
            {contentFeatured}
          </Link>
        ) : (
          <div className={cardLinkClass}>{contentFeatured}</div>
        )}
      </article>
    );
  }

  // compact: image left, content right
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm">
      {item.href ? (
        <Link href={item.href} className={cardCompactLinkClass}>
          {contentCompact}
        </Link>
      ) : (
        <div className={cardCompactLinkClass}>{contentCompact}</div>
      )}
    </article>
  );
}
