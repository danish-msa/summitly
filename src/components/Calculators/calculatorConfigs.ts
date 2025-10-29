import { Home, DollarSign, TrendingUp, Scale } from "lucide-react";

export interface CalculatorConfig {
  slug: string;
  icon: typeof Home;
  title: string;
  subtitle: string;
  about: {
    description: string;
    features: string[];
    estimatedTime: string;
    difficulty: string;
  };
  tips: Array<{
    title: string;
    description: string;
    color: "blue" | "green" | "purple";
  }>;
  related: Array<{
    href: string;
    icon: typeof Home;
    title: string;
    status: string;
  }>;
}

export const calculatorConfigs: Record<string, CalculatorConfig> = {
  mortgage: {
    slug: "mortgage",
    icon: Home,
    title: "Mortgage Calculator",
    subtitle: "Calculate your mortgage payments and costs",
    about: {
      description: "Our comprehensive mortgage calculator helps you understand all the costs associated with buying a home in Canada.",
      features: [
        "Monthly mortgage payments",
        "Cash needed to close",
        "Land transfer taxes",
        "CMHC insurance costs",
        "Amortization schedule",
        "Interest rate risk analysis",
      ],
      estimatedTime: "2-3 minutes",
      difficulty: "Beginner",
    },
    tips: [
      {
        title: "First-time buyers",
        description: "You may be eligible for rebates on land transfer taxes in Ontario.",
        color: "blue",
      },
      {
        title: "Down payment",
        description: "A 20% down payment eliminates CMHC insurance costs.",
        color: "green",
      },
      {
        title: "Interest rates",
        description: "Consider how rate changes might affect your payments at renewal.",
        color: "purple",
      },
    ],
    related: [
      {
        href: "/calculators/down-payment",
        icon: DollarSign,
        title: "Down Payment Calculator",
        status: "Available",
      },
      {
        href: "/calculators/rent-vs-buy",
        icon: TrendingUp,
        title: "Rent vs Buy Calculator",
        status: "Available",
      },
    ],
  },
  "down-payment": {
    slug: "down-payment",
    icon: DollarSign,
    title: "Down Payment Calculator",
    subtitle: "Calculate your down payment requirements and savings goals",
    about: {
      description: "Calculate how much you need for a down payment and explore different scenarios to reach your home buying goals.",
      features: [
        "Required down payment amount",
        "Down payment percentage",
        "CMHC insurance costs",
        "Monthly mortgage payments",
        "Total mortgage amount",
        "Payment frequency options",
      ],
      estimatedTime: "1-2 minutes",
      difficulty: "Beginner",
    },
    tips: [
      {
        title: "Minimum down payment",
        description: "In Canada, the minimum down payment is 5% for homes under $500,000.",
        color: "blue",
      },
      {
        title: "20% threshold",
        description: "A 20% down payment eliminates CMHC insurance costs, saving you thousands.",
        color: "green",
      },
      {
        title: "First-time buyers",
        description: "Consider government programs like the Home Buyer's Plan for RRSP withdrawals.",
        color: "purple",
      },
    ],
    related: [
      {
        href: "/calculators/mortgage",
        icon: Home,
        title: "Mortgage Calculator",
        status: "Available",
      },
      {
        href: "/calculators/rent-vs-buy",
        icon: TrendingUp,
        title: "Rent vs Buy Calculator",
        status: "Coming Soon",
      },
    ],
  },
  "rent-vs-buy": {
    slug: "rent-vs-buy",
    icon: TrendingUp,
    title: "Rent vs Buy Calculator",
    subtitle: "Compare the costs of renting vs buying a home",
    about: {
      description: "Determine whether renting or buying makes more financial sense for you by comparing total costs, equity growth, and investment opportunities over time.",
      features: [
        "Breakeven horizon calculation",
        "Year-by-year cost comparison",
        "Equity vs investment growth",
        "Home appreciation tracking",
        "Rent increase projections",
        "Comprehensive cost analysis",
      ],
      estimatedTime: "3-5 minutes",
      difficulty: "Intermediate",
    },
    tips: [
      {
        title: "Consider your timeline",
        description: "If you plan to move within 5 years, renting often makes more financial sense due to closing costs and market volatility.",
        color: "blue",
      },
      {
        title: "Factor in opportunity cost",
        description: "Consider what you could earn by investing your down payment instead of using it to buy property.",
        color: "green",
      },
      {
        title: "Don't forget hidden costs",
        description: "Homeownership includes maintenance, property taxes, and insurance that can add 2-4% of home value annually.",
        color: "purple",
      },
    ],
    related: [
      {
        href: "/calculators/mortgage",
        icon: Home,
        title: "Mortgage Calculator",
        status: "Available",
      },
      {
        href: "/calculators/down-payment",
        icon: DollarSign,
        title: "Down Payment Calculator",
        status: "Available",
      },
    ],
  },
};

