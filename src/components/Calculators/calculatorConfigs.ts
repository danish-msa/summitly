import { Home, DollarSign, TrendingUp, Building, Calculator } from "lucide-react";

export interface CalculatorConfig {
  slug: string;
  icon: typeof Home;
  title: string;
  subtitle: string;
  about: {
    icon: typeof Home;
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
      icon: Home,
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
      icon: DollarSign,
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
      icon: TrendingUp,
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
        status: "available",
      },
      {
        href: "/calculators/down-payment",
        icon: DollarSign,
        title: "Down Payment Calculator",
        status: "available",
      },
    ],
  },
  "property-tax": {
    slug: "property-tax",
    icon: Building,
    title: "Property Tax Calculator",
    subtitle: "Calculate your annual property taxes for residential and commercial properties",
    about: {
      icon: Building,
      description: "Estimate your property taxes using official 2025 tax rates for Toronto and other major Ontario municipalities. Includes all property types and special considerations.",
      features: [
        "2025 official tax rates",
        "Multiple property types",
        "First-time buyer rebates",
        "Payment schedule options",
        "Special charges inclusion",
        "Market value estimation"
      ],
      estimatedTime: "3-5 minutes",
      difficulty: "Easy"
    },
    tips: [
      {
        title: "Use Accurate Assessment",
        description: "Your MPAC assessment value is the most accurate base for calculations. Check your property tax bill for the current assessment.",
        color: "blue"
      },
      {
        title: "Consider Special Charges",
        description: "Don't forget BIA levies, local improvement charges, and other special assessments that may apply to your property.",
        color: "green"
      },
      {
        title: "First-Time Buyer Benefits",
        description: "If you're a first-time buyer, you may be eligible for rebates that can significantly reduce your property taxes.",
        color: "purple"
      }
    ],
    related: [
      {
        href: "/calculators/mortgage",
        icon: Home,
        title: "Mortgage Calculator",
        status: "available"
      },
      {
        href: "/calculators/down-payment",
        icon: DollarSign,
        title: "Down Payment Calculator",
        status: "available"
      },
      {
        href: "/calculators/rent-vs-buy",
        icon: TrendingUp,
        title: "Rent vs Buy Calculator",
        status: "available"
      }
    ]
  },
  affordability: {
    slug: "affordability",
    icon: Calculator,
    title: "House Affordability Calculator",
    subtitle: "Calculate how much house you can afford based on your income",
    about: {
      icon: Calculator,
      description: "Use our affordability calculator to estimate a comfortable mortgage amount based on your current budget. Enter details about your income, down payment and monthly debts to determine how much to spend on a house.",
      features: [
        "Calculate from income or payment",
        "DTI ratio calculations (36/43 rule)",
        "Monthly payment breakdown",
        "PMI calculations",
        "Property taxes and insurance",
        "HOA fees support",
        "Advanced customization options",
      ],
      estimatedTime: "2-3 minutes",
      difficulty: "Beginner",
    },
    tips: [
      {
        title: "DTI Ratio Guidelines",
        description: "Lenders typically use a 36/43 rule: monthly housing costs should be ≤36% of income, and total debt ≤43% of income.",
        color: "blue",
      },
      {
        title: "20% Down Payment",
        description: "A 20% down payment eliminates PMI (Private Mortgage Insurance), saving you hundreds per month.",
        color: "green",
      },
      {
        title: "Consider All Costs",
        description: "Don't forget property taxes, insurance, HOA fees, and maintenance when calculating affordability.",
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
      {
        href: "/calculators/rent-vs-buy",
        icon: TrendingUp,
        title: "Rent vs Buy Calculator",
        status: "Available",
      },
    ],
  }
};

