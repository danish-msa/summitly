export type AgentTypeValue = "RESIDENTIAL" | "COMMERCIAL" | "BOTH";

export type AgentListItem = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  email: string | null;
  title: string;
  specializations: string[];
  languages: string[];
  phone: string | null;
  agent_type: AgentTypeValue;
  verified_agent: boolean;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
};
