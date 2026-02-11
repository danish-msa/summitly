import Link from "next/link";

export interface LatestNewsItem {
  category: string;
  headline: string;
  author: string;
  href?: string;
}

const defaultItems: LatestNewsItem[] = [
  {
    category: "Celebrity Real Estate",
    headline: "Mark Zuckerberg Buys '$150 Million' Mansion on Miami's Billionaire Bunker",
    author: "Charlie Lankston",
  },
  {
    category: "Celebrity Real Estate",
    headline: "Source Reveals How Nancy Guthrie's Family Discovered She Was Missing",
    author: "Charlie Lankston",
  },
  {
    category: "Sell",
    headline: "Why Older Sellers Get Worse Deals and How To Protect Yourself",
    author: "Eric Goldschein",
  },
  {
    category: "Unique Homes",
    headline: "Barn Conversion With Indoor Lap Pool and Pottery Studio Lists for $800K",
    author: "Kellie Speed",
  },
  {
    category: "Sports",
    headline: "Former NFL QB Chris Simms Lists 300-Year-Old Greenwich Home for $8 Million",
    author: "Kelsi Karruli",
  },
  {
    category: "Real Estate News",
    headline: "House Passes Major Housing Bill Aimed at Affordability",
    author: "Tristan Navera",
  },
  {
    category: "Celebrity Real Estate",
    headline: "Post Malone's Childhood Home Hits the Market in Texas for Under $550K",
    author: "Kelsi Karruli",
  },
];

interface LatestNewsLayoutProps {
  date?: string;
  items?: LatestNewsItem[];
  title?: string;
}

export default function LatestNewsLayout({
  date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  items = defaultItems,
  title = "Latest News",
}: LatestNewsLayoutProps) {
  return (
    <aside className="flex flex-col" aria-label={title}>
      <p className="text-xs font-normal uppercase tracking-wide text-zinc-400">
        {date}
      </p>
      <h2 className="mt-2 text-lg font-bold text-zinc-800">{title}</h2>
      <ul className="mt-4 flex flex-col divide-y divide-zinc-200" role="list">
        {items.map((item, index) => (
          <li key={index} className="py-4 first:pt-0">
            <Link
              href={item.href ?? "#"}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
                {item.category}
              </span>
              <span className="mt-1 block text-sm font-medium text-zinc-800 group-hover:text-zinc-600">
                {item.headline}
              </span>
              <span className="mt-1 block text-xs text-zinc-400">
                {item.author}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
