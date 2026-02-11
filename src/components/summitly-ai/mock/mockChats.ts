import type { AiChat } from "../types";

const now = new Date();
const iso = (d: Date) => d.toISOString();

const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
};

export function getMockChats(): AiChat[] {
  const chat1: AiChat = {
    id: "chat-1",
    title: "Find me all properties for sale in San Antonio, TX that have greater than 5% rental yield",
    createdAt: iso(daysAgo(0)),
    updatedAt: iso(daysAgo(0)),
    messages: [
      {
        id: "m-1",
        role: "user",
        createdAt: iso(daysAgo(0)),
        userText:
          "Find me all properties for sale in San Antonio, TX that have greater than 5% rental yield",
      },
      {
        id: "m-2",
        role: "assistant",
        createdAt: iso(daysAgo(0)),
        assistant: {
          intro:
            "I found 10 single family homes for sale with pools in 92037 (San Diego, CA). Here's what these properties look like:",
          sections: [
            {
              title: "Size & Features",
              bullets: [
                "3 to 8 bedrooms (median: 6)",
                "2 to 8 bathrooms (median: 6.5)",
                "2,839 to 11,434 sq ft (median: 5,683.5)",
              ],
            },
            {
              title: "Value & Age",
              bullets: [
                "AVM values range from $4,427,285 to $15,092,134 (median: $10,833,551.5)",
                "Built between 1960 and 2025 (median: 2007.5)",
              ],
            },
          ],
          outro:
            "Would you like me to filter these results further by price range, number of bedrooms, or other criteria?",
          dataset: {
            name: "properties-92037",
            json: {
              rows: [
                { address: "92037 Example St", bedrooms: 4, bathrooms: 3, price: 4427285 },
                { address: "92037 Sample Ave", bedrooms: 6, bathrooms: 5, price: 10833551 },
              ],
            },
            csv:
              "address,bedrooms,bathrooms,price\n92037 Example St,4,3,4427285\n92037 Sample Ave,6,5,10833551\n",
            previewColumns: ["address", "bedrooms", "bathrooms", "price"],
            previewRows: [
              { address: "92037 Example St", bedrooms: 4, bathrooms: 3, price: 4427285 },
              { address: "92037 Sample Ave", bedrooms: 6, bathrooms: 5, price: 10833551 },
            ],
          },
        },
      },
    ],
  };

  const chat2: AiChat = {
    id: "chat-2",
    title: "What is the estimated value of 7209 48th Street Ct NW, Gig Harbor, WA?",
    createdAt: iso(daysAgo(0)),
    updatedAt: iso(daysAgo(0)),
    messages: [],
  };

  const chat3: AiChat = {
    id: "chat-3",
    title: "Find me all single family homes for sale with a pool in 92037",
    createdAt: iso(daysAgo(0)),
    updatedAt: iso(daysAgo(0)),
    messages: [],
  };

  const chat4: AiChat = {
    id: "chat-4",
    title: "What is the estimated value of 7209 48th Street Ct NW, Gig Harbor, WA?",
    createdAt: iso(daysAgo(12)),
    updatedAt: iso(daysAgo(12)),
    messages: [],
  };

  return [chat1, chat2, chat3, chat4];
}

