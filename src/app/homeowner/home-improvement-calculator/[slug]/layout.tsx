import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Home Improvement Calculator | My Home | Summitly`,
    description:
      "Explore home improvement scenarios and see how updates and remodels can add value to your home. Cost and value estimates based on your area.",
    openGraph: {
      title: "Home Improvement Calculator | My Home | Summitly",
      description:
        "Explore home improvement scenarios and see how updates and remodels can add value to your home.",
      type: "website",
    },
    alternates: {
      canonical: `/homeowner/home-improvement-calculator/${slug}`,
    },
  };
}

export default function HomeImprovementCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
