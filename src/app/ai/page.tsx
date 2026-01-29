import type { Metadata } from "next";
import { AiChatApp } from "@/components/summitly-ai";

export const metadata: Metadata = {
  title: "AI Assistant | Summit Realty",
  description:
    "Chat with Summit Realty AI to search properties, estimate values, and explore market insights.",
  openGraph: {
    title: "AI Assistant | Summit Realty",
    description:
      "Chat with Summit Realty AI to search properties, estimate values, and explore market insights.",
    type: "website",
  },
  alternates: {
    canonical: "/ai",
  },
};

export default function AIPage() {
  return <AiChatApp />;
}

