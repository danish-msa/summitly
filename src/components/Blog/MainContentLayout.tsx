import Image from "next/image";
import Link from "next/link";

export interface FeaturedQuote {
  quote: string;
  author: string;
  title: string;
}

export interface FeaturedArticle {
  category?: string;
  headline: string;
  snippet?: string;
  author?: string;
  imageSrc?: string;
  imageCredit?: string;
  href?: string;
}

const defaultQuote: FeaturedQuote = {
  quote:
    '"These markets, largely concentrated in the Midwest and South, stand out as rare pockets of affordability in the otherwise challenging housing market."',
  author: "Hannah Jones",
  title: "Senior Economic Research Analyst",
};

const defaultFeatured: FeaturedArticle[] = [
  {
    headline:
      "Here's How Much You Need To Earn To Buy a Home in the Most Affordable Cities",
    imageCredit: "Realtor.com/Getty Images",
    href: "#",
  },
  {
    category: "Trends",
    headline:
      "America Tilts Toward a Buyer's Market as Listings Pile Up in More Metros",
    snippet:
      "Miami and Austin lead a growing list of 18 metros that have officially tipped into buyer's markets.",
    author: "Snejana Farberov",
    href: "#",
  },
];

interface MainContentLayoutProps {
  quote?: FeaturedQuote;
  featured?: FeaturedArticle[];
}

export default function MainContentLayout({
  quote = defaultQuote,
  featured = defaultFeatured,
}: MainContentLayoutProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Quote block */}
      <blockquote className="border-l-0 pl-0">
        <p className="text-lg font-medium leading-snug text-zinc-800 md:text-xl">
          {quote.quote}
        </p>
        <footer className="mt-2 text-sm text-zinc-500">
          <cite className="not-italic">
            {quote.author}
            {quote.title && ` / ${quote.title}`}
          </cite>
        </footer>
      </blockquote>

      {/* Featured articles */}
      <div className="flex flex-col gap-10">
        {featured.map((article, index) => (
          <article key={index} className="flex flex-col">
            {article.category && (
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {article.category}
              </span>
            )}
            <Link
              href={article.href ?? "#"}
              className="mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <h3
                className={
                  index === 0
                    ? "text-2xl font-bold leading-tight text-zinc-800 md:text-3xl"
                    : "text-xl font-bold leading-tight text-zinc-800 md:text-2xl"
                }
              >
                {article.headline}
              </h3>
            </Link>
            {article.imageSrc && (
              <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg bg-zinc-200">
                <Image
                  src={article.imageSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                {article.imageCredit && (
                  <span className="absolute bottom-2 right-2 text-xs text-zinc-500">
                    {article.imageCredit}
                  </span>
                )}
              </div>
            )}
            {!article.imageSrc && article.imageCredit && (
              <div className="mt-4 flex aspect-video w-full items-end justify-end rounded-lg bg-zinc-200 p-3">
                <span className="text-xs text-zinc-500">
                  {article.imageCredit}
                </span>
              </div>
            )}
            {article.snippet && (
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                {article.snippet}
              </p>
            )}
            {article.author && (
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                {article.author}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
