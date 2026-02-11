import React from "react";
import { FindRealtorAgentsResults } from "@/components/FindRealtor/Agents";

interface PageProps {
  params: Promise<{
    search: string;
    intent: string;
    sort: string;
    agenttype: string;
    page: string;
  }>;
}

export default async function FindAnAgentResultsPage({ params }: PageProps) {
  const { search, intent, sort, agenttype, page } = await params;
  return (
    <FindRealtorAgentsResults
      search={search}
      intent={intent}
      sort={sort}
      agenttype={agenttype}
      page={page}
    />
  );
}
