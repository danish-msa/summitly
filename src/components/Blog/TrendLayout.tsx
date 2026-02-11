import TrendCard, { TrendCardItem } from "./TrendCard";

const defaultFeatured: TrendCardItem = {
  category: "Trend",
  title:
    "The McMansion era is over: How American homes have changed in 20 years",
  excerpt:
    "Welcome to Real Estate, where we turn houses into homes and dreams into reality.",
  imageSrc: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  imageAlt: "Modern house exterior",
  href: "#",
};

const defaultCompactItems: TrendCardItem[] = [
  {
    category: "Trend",
    title:
      "The McMansion era is over: How American homes have changed in 20 years",
    imageSrc:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    imageAlt: "Row of modern houses by water",
    href: "#",
  },
  {
    category: "Trend",
    title:
      "The McMansion era is over: How American homes have changed in 20 years",
    imageSrc:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    imageAlt: "Row of modern houses by water",
    href: "#",
  },
  {
    category: "Trend",
    title:
      "The McMansion era is over: How American homes have changed in 20 years",
    imageSrc:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    imageAlt: "Row of modern houses by water",
    href: "#",
  },
];

interface TrendLayoutProps {
  sectionTitle?: string;
  featured?: TrendCardItem;
  items?: TrendCardItem[];
}

export default function TrendLayout({
  sectionTitle = "Trend",
  featured = defaultFeatured,
  items = defaultCompactItems,
}: TrendLayoutProps) {
  return (
    <section
      className="mx-auto max-w-[1400px] border-t border-zinc-200 px-4 pt-10 pb-16 md:px-8"
      aria-labelledby="trend-heading"
    >
      <h2 id="trend-heading" className="mb-6 text-xl font-bold text-zinc-800">
        {sectionTitle}
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="min-w-0">
          <TrendCard item={featured} variant="featured" />
        </div>
        <div className="flex flex-col gap-6">
          {items.map((item, index) => (
            <TrendCard key={index} item={item} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
}
