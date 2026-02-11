import { redirect } from "next/navigation";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Legacy URL: redirect /assignment-sale to /assignments (query params preserved)
 */
export default async function AssignmentSaleRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, Array.isArray(value) ? value[0]! : value);
  });
  const qs = query.toString();
  redirect(qs ? `/assignments?${qs}` : "/assignments");
}
