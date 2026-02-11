import Image from "next/image";
import Link from "next/link";

export interface ColumnistCardItem {
  category: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  href?: string;
}

const defaultItems: ColumnistCardItem[] = [
  {
    category: "Unique Homes",
    title:
      "Staggering Golden Beach Megamansion Hits the Market for $88.9 Million",
    description:
      "Located in one of Florida's most exclusive communities, the property boasts an array of awesome amenities, including a wellness retreat.",
    imageSrc:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
    imageAlt: "Luxury home with pool and modern architecture",
    href: "#",
  },
  {
    category: "Finance",
    title:
      "Your Tax Refund Might Take Longer If You Don't Follow Direct Deposit Change",
    description:
      "The federal government wants you to get your refund faster, but not making the mandatory change could delay your money by months.",
    href: "#",
  },
  {
    category: "Unique Homes",
    title:
      "The Ultimate Escape Homes: Remote Retreats Offering Stress-Free Lifestyles",
    description:
      'For those seeking a true sanctuary from the hustle and bustle of everyday life, an "escape home" is the perfect abode.',
    href: "#",
  },
  {
    category: "Celebrity Real Estate",
    title:
      "Billionaire Scripps Heir Sam Logan Unlocks the Door to $22 Million Fortress",
    description:
      "Logan, 34, landed the fortified Belle Meade Island residence—as well as a job with the home's developer—in November 2025.",
    href: "#",
  },
];

interface ColumnistsLayoutProps {
  title?: string;
  items?: ColumnistCardItem[];
}

export default function ColumnistsLayout({
  title = "From our columnists",
  items = defaultItems,
}: ColumnistsLayoutProps) {
  return (
    <section
      className="mx-auto max-w-[1400px] border-t border-zinc-200 px-4 py-12 md:px-8 md:py-16"
      aria-labelledby="columnists-heading"
    >
      <h2
        id="columnists-heading"
        className="text-center text-2xl font-bold text-zinc-900 md:text-3xl"
      >
        {title}
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
        {items.map((item, index) => {
          const cardContent = (
            <>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-200">
                {item.imageSrc ? (
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt ?? item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : null}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {item.category}
                </span>
                <h3 className="font-bold leading-tight text-zinc-900 line-clamp-3">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 line-clamp-3">
                  {item.description}
                </p>
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
