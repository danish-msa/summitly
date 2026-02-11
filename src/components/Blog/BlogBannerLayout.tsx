import BlogNav from "./BlogNav";

export default function BlogBannerLayout() {
  return (
    <header className="border-b border-zinc-200 bg-white pt-24 pb-4">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <h1 className="text-center text-3xl font-bold tracking-tight text-zinc-800 md:text-4xl">
          News &amp; Insights
        </h1>
        <BlogNav />
      </div>
    </header>
  );
}
