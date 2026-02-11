import type { Metadata } from "next";
import { AiChatAppIntegrated } from "@/components/summitly-ai";

export const metadata: Metadata = {
  title: "AI Assistant | Summit Realty",
  description:
    "Chat with Summit Realty AI to search properties, estimate values, and explore market insights. Powered by advanced AI and live MLS data.",
  openGraph: {
    title: "AI Assistant | Summit Realty",
    description:
      "Chat with Summit Realty AI to search properties, estimate values, and explore market insights. Powered by advanced AI and live MLS data.",
    type: "website",
  },
  alternates: {
    canonical: "/ai",
  },
};

export default function AIPage() {
  return <AiChatAppIntegrated />;
}

