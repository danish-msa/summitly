import Image from "next/image";
import Link from "next/link";

export interface EditorsPickItem {
  imageSrc: string;
  imageAlt: string;
  category: string;
  title: string;
  author: string;
  href?: string;
}

const defaultItems: EditorsPickItem[] = [
  {
    imageSrc:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
    imageAlt: "Modern white house with pool and greenery",
    category: "Celebrity Real Estate",
    title:
      "Simone Biles and Jonathan Owens Quit Chicago and Move Back to Houston",
    author: "Charlie Lankstion",
    href: "#",
  },
  {
    imageSrc:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
    imageAlt: "Person working with blueprints",
    category: "Real Estate News",
    title: "Homebuilders Respond to Reported Plan for DOJ Antitrust Probe",
    author: "Keith Griffith",
    href: "#",
  },
  {
    imageSrc:
      "https://images.unsplash.com/photo-1552321554-5fefe6c9ef14?w=600&q=80",
    imageAlt: "Contemporary bathroom interior",
    category: "Home Improvement",
    title:
      "The Dangerous New TikTok Trend That Burned 9-Year-Old Boy in His Home",
    author: "Anna Baluch",
    href: "#",
  },
  {
    imageSrc:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
    imageAlt: "House keys and new home",
    category: "Down Payment Diaries",
    title:
      "I'm a 38-Year-Old Mortgage Loan Officer and I Built a $1,000,000 Home With an ADU in Connecticut",
    author: "Brooke Morton",
    href: "#",
  },
];

interface EditorsPicksLayoutProps {
  title?: string;
  items?: EditorsPickItem[];
  headingId?: string;
}

export default function EditorsPicksLayout({
  title = "Editor's picks",
  items = defaultItems,
  headingId = "editors-picks-heading",
}: EditorsPicksLayoutProps) {
  return (
    <section
      className="mx-auto max-w-[1400px] border-t border-zinc-200 px-4 py-12 md:px-8 md:py-16"
      aria-labelledby={headingId}
    >
      <h2
        id={headingId}
        className="text-2xl font-bold text-zinc-900 md:text-3xl"
      >
        {title}
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const cardContent = (
            <>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-200">
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {item.category}
                </span>
                <h3 className="font-bold leading-tight text-zinc-900 line-clamp-3">
                  {item.title}
                </h3>
                <span className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {item.author}
                </span>
              </div>
            </>
          );

          const className =
            "group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

          if (item.href) {
            return (
              <Link key={index} href={item.href} className={className}>
                {cardContent}
              </Link>
            );
          }

          return (
            <article key={index} className={className}>
              {cardContent}
            </article>
          );
        })}
      </div>
    </section>
  );
}
