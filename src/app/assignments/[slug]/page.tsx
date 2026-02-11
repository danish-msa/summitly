"use client";

import React from "react";
import PreConItem from "@/components/PreConItem/PreConItem";

/**
 * Assignment project detail: /assignments/{projectname}
 * PreConItem reads params.slug (from this route’s [slug]) and fetches /api/pre-con-projects/{slug}.
 * project.id in the assignments list is the same slug (mlsNumber), so links match the API.
 */
export default function AssignmentProjectPage() {
  return <PreConItem />;
}
