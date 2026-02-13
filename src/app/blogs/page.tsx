import { redirect } from "next/navigation";

export default function BlogsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams(params as Record<string, string>).toString();
  redirect(query ? `/news?${query}` : "/news");
}
