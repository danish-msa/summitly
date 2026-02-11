import type { Metadata } from "next";
import {
  AssignmentsBanner,
  AssignmentProjectsList,
  AssignmentSaleContent,
  AssignmentContactSection,
} from "@/components/Assignments";

export const metadata: Metadata = {
  title: "Assignments | Pre-Construction Take-Over | Summitly",
  description:
    "Browse assignment sales: take over a pre-construction buyer's Agreement of Purchase and Sale before closing. The assignee completes the deal with the seller.",
  openGraph: {
    title: "Assignments | Pre-Construction Take-Over | Summitly",
    description:
      "Take over a pre-construction purchase before closing. Assignment projects let the assignee complete the deal with the seller.",
  },
};

export default function AssignmentsPage() {
  return (
    <div className="min-h-screen bg-white">
      <AssignmentsBanner />
      <AssignmentProjectsList />
      <AssignmentSaleContent />
      <AssignmentContactSection />
    </div>
  );
}
