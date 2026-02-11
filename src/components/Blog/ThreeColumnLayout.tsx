import LatestNewsLayout from "./LatestNewsLayout";
import MainContentLayout from "./MainContentLayout";
import ResearchSidebarLayout from "./ResearchSidebarLayout";

export default function ThreeColumnLayout() {
  return (
    <section
      className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-8 px-4 py-10 md:px-8 lg:grid-cols-12 lg:gap-10"
      aria-label="News and insights content"
    >
      {/* Left: Latest News */}
      <div className="lg:col-span-3">
        <LatestNewsLayout />
      </div>

      {/* Middle: Main content */}
      <div className="lg:col-span-6">
        <MainContentLayout />
      </div>

      {/* Right: Research */}
      <div className="lg:col-span-3">
        <ResearchSidebarLayout />
      </div>
    </section>
  );
}
