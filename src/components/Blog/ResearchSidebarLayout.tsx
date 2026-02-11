import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface ResearchUpdateCard {
  title: string;
  author: string;
  role: string;
  avatarSrc?: string;
  ctaTitle?: string;
  ctaSubtext?: string;
  readLinkLabel?: string;
  href?: string;
}

export interface ResearchReportCard {
  title: string;
  snippet: string;
  date: string;
  href?: string;
}

const defaultWeeklyUpdate: ResearchUpdateCard = {
  title: "Weekly Housing Market Update",
  author: "Danielle Hale",
  role: "Realtor.com Chief Economist",
  ctaTitle: "Weekly Housing Market Update",
  ctaSubtext: "With Chief Economist Danielle Hale",
  readLinkLabel: "Read the full article",
  href: "#",
};

const defaultMonthlyReport: ResearchReportCard = {
  title: "January 2026 Monthly Housing Market Trends Report",
  snippet:
    "The national inventory recovery has stalled and is now moving in the wrong direction after solid progress in most of 2025.",
  date: "February 5, 2026",
  href: "#",
};

interface ResearchSidebarLayoutProps {
  title?: string;
  weeklyUpdate?: ResearchUpdateCard;
  monthlyReport?: ResearchReportCard;
}

export default function ResearchSidebarLayout({
  title = "Research",
  weeklyUpdate = defaultWeeklyUpdate,
  monthlyReport = defaultMonthlyReport,
}: ResearchSidebarLayoutProps) {
  return (
    <aside className="flex flex-col gap-8" aria-label={title}>
      <h2 className="text-lg font-bold text-zinc-800">{title}</h2>

      {/* Weekly update card */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 rounded-full border border-zinc-200 bg-zinc-100">
            {weeklyUpdate.avatarSrc ? (
              <Image
                src={weeklyUpdate.avatarSrc}
                alt=""
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <AvatarFallback className="rounded-full bg-zinc-200 text-xs text-zinc-600">
                {weeklyUpdate.author
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-zinc-800">
              {weeklyUpdate.title}
            </h3>
            <p className="text-xs text-zinc-500">{weeklyUpdate.author}</p>
            <p className="text-xs text-zinc-500">{weeklyUpdate.role}</p>
          </div>
        </div>
        <Link
          href={weeklyUpdate.href ?? "#"}
          className="block rounded-lg bg-gradient-to-br from-indigo-700 to-indigo-900 px-4 py-4 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="block font-semibold">
            {weeklyUpdate.ctaTitle ?? weeklyUpdate.title}
          </span>
          {weeklyUpdate.ctaSubtext && (
            <span className="mt-0.5 block text-sm text-indigo-200">
              {weeklyUpdate.ctaSubtext}
            </span>
          )}
        </Link>
        {weeklyUpdate.readLinkLabel && (
          <Link
            href={weeklyUpdate.href ?? "#"}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            {weeklyUpdate.readLinkLabel}
          </Link>
        )}
      </div>

      {/* Monthly report card */}
      <article className="flex flex-col gap-2">
        <Link
          href={monthlyReport.href ?? "#"}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <h3 className="font-bold text-zinc-800">{monthlyReport.title}</h3>
        </Link>
        <p className="text-sm leading-relaxed text-zinc-600">
          {monthlyReport.snippet}
        </p>
        <time
          className="text-xs text-zinc-400"
          dateTime={new Date(monthlyReport.date).toISOString().split("T")[0]}
        >
          {monthlyReport.date}
        </time>
      </article>
    </aside>
  );
}
