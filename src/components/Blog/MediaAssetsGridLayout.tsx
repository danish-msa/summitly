import Image from "next/image";
import Link from "next/link";

export interface MediaAssetItem {
  label: string;
  title: string;
  href?: string;
  iconSrc?: string;
  iconAlt?: string;
}

const defaultItems: MediaAssetItem[] = Array(6).fill({
  label: "media assets",
  title:
    "The McMansion era is over: How American homes have changed in 20 years",
  href: "#",
});

interface MediaAssetsGridLayoutProps {
  title?: string;
  subtitle?: string;
  items?: MediaAssetItem[];
}

export default function MediaAssetsGridLayout({
  title = "Additional media assets.",
  subtitle =
    "Explore summitly latest press releases, featuring company news, product updates and media announcements.",
  items = defaultItems,
}: MediaAssetsGridLayoutProps) {
  return (
    <section
      className="mx-auto max-w-[1400px] border-t border-zinc-200 px-4 py-12 md:px-8 md:py-16"
      aria-labelledby="media-assets-heading"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="media-assets-heading"
          className="text-2xl font-bold text-zinc-900 md:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 md:text-base">
          {subtitle}
        </p>
      </div>

      <div className="mx-auto mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
        {items.map((item, index) => {
          const cardContent = (
            <>
              <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                {item.iconSrc ? (
                  <Image
                    src={item.iconSrc}
                    alt={item.iconAlt ?? ""}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <span className="mt-3 block text-sm font-bold text-zinc-900">
                {item.label}.
              </span>
              <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-zinc-600">
                {item.title}
              </p>
            </>
          );

          const className =
            "flex flex-col rounded-xl border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

          if (item.href) {
            return (
              <Link
                key={index}
                href={item.href}
                className={className}
              >
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
