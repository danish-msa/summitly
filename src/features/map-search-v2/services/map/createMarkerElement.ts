import type { MouseEvent } from "react";

export function createMarkerElement(args: {
  id: string;
  label: string;
  href?: string;
  size?: "single" | "cluster";
  onClick?: (e: MouseEvent) => void;
  onTap?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}): HTMLElement {
  const el = document.createElement("a");
  el.id = args.id;
  el.href = args.href || "#";
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", args.size === "cluster" ? `Cluster of ${args.label} listings` : `Listing ${args.label}`);

  // IMPORTANT:
  // We intentionally use Tailwind utility classes directly here (instead of relying on global CSS)
  // so styles always apply to Mapbox marker DOM nodes.
  const base =
    "select-none cursor-pointer no-underline " +
    "shadow-md hover:shadow-lg " +
    "border border-white/70 " +
    "font-semibold text-xs leading-none " +
    "focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2";

  const cluster =
    "bg-secondary text-white " +
    "rounded-full w-10 h-10 " +
    "flex items-center justify-center";

  const single =
    "bg-white text-gray-900 " +
    "rounded-lg px-2.5 py-1.5";

  el.className = `${base} ${args.size === "cluster" ? cluster : single}`;
  // Safety: ensure anchor doesn't get underlined by browser defaults
  el.style.textDecoration = "none";

  el.innerText = args.label;

  // Tap behavior (mobile) – do not navigate by default.
  el.addEventListener("click", (ev) => {
    if (args.onClick) {
      ev.preventDefault();
      args.onClick(ev as unknown as MouseEvent);
      return;
    }
    if (args.onTap) {
      ev.preventDefault();
      args.onTap();
      return;
    }
  });

  if (args.onMouseEnter) el.addEventListener("mouseenter", () => args.onMouseEnter?.());
  if (args.onMouseLeave) el.addEventListener("mouseleave", () => args.onMouseLeave?.());

  return el;
}

