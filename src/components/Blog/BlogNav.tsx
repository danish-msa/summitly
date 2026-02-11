"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    label: "News & Trends",
    href: "#",
    hasDropdown: true,
    dropdownItems: ["Market Trends", "News", "Reports"],
  },
  { label: "Buying", href: "#" },
  { label: "Selling", href: "#" },
  { label: "Renting", href: "#" },
  { label: "Celebrity Homes", href: "#" },
  {
    label: "Advice",
    href: "#",
    hasDropdown: true,
    dropdownItems: ["Buying Tips", "Selling Tips", "Financing"],
  },
  { label: "Guides", href: "#" },
  { label: "Living", href: "#" },
  { label: "Research", href: "#" },
  { label: "More", href: "#" },
];

export default function BlogNav() {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6"
      aria-label="News and insights categories"
    >
      {navItems.map((item) =>
        item.hasDropdown ? (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto p-0 text-sm font-normal text-zinc-600 hover:bg-transparent hover:text-zinc-900 data-[state=open]:text-zinc-900"
                aria-haspopup="menu"
                aria-expanded={undefined}
              >
                {item.label.toUpperCase()}
                <ChevronDown className="ml-1 h-3.5 w-3.5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[10rem]">
              {item.dropdownItems?.map((sub) => (
                <DropdownMenuItem key={sub} asChild>
                  <Link href="#">{sub}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className="text-sm font-normal text-zinc-600 hover:text-zinc-900"
          >
            {item.label.toUpperCase()}
          </Link>
        )
      )}
      <Button
        variant="ghost"
        size="icon"
        className="ml-2 h-9 w-9 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        aria-label="Search"
      >
        <Search className="h-4 w-4" aria-hidden />
      </Button>
    </nav>
  );
}
