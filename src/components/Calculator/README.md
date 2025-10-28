# Mortgage Calculator Component

A comprehensive mortgage payment calculator component built for Canadian real estate applications.

## Features

- **Multi-scenario comparison**: Compare different down payment percentages (5%, 10%, 15%, 20%)
- **CMHC insurance calculation**: Automatic calculation based on down payment percentage
- **Flexible payment frequencies**: Weekly, bi-weekly, monthly, etc.
- **Closing costs calculator**: Land transfer tax, lawyer fees, inspections, etc.
- **Monthly expenses tracker**: Property tax, utilities, insurance, etc.
- **Interest rate risk analysis**: See how rate changes affect payments
- **Historical rate chart**: Visual representation of mortgage rates over time
- **First-time buyer rebates**: Automatic rebate calculations

## Usage

### Basic Usage

```tsx
import { MortgageCalculator } from '@/components/Calculator';

export default function MyPage() {
  return <MortgageCalculator />;
}
```

### With Custom Initial Values

```tsx
import { MortgageCalculator } from '@/components/Calculator';

export default function PropertyPage() {
  return (
    <MortgageCalculator 
      initialHomePrice={750000}
      initialLocation="Vancouver, BC"
      className="my-custom-class"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialHomePrice` | `number` | `596000` | Initial home price value |
| `initialLocation` | `string` | `"Toronto, ON"` | Initial location value |
| `className` | `string` | `""` | Additional CSS classes |

## Components

### MortgageCalculator
The main calculator component with all functionality.

### InterestRateChart
A chart component showing historical mortgage rates. Used internally by MortgageCalculator.

## Key Calculations

### CMHC Insurance
- 20%+ down payment: No insurance required
- 15-19.99%: 2.8% of loan amount
- 10-14.99%: 3.1% of loan amount
- 5-9.99%: 4.0% of loan amount

### Payment Frequencies
- **Weekly**: Monthly payment × 12 ÷ 52
- **Accelerated Weekly**: Monthly payment ÷ 4
- **Bi-weekly**: Monthly payment × 12 ÷ 26
- **Accelerated Bi-weekly**: Monthly payment ÷ 2
- **Semi-monthly**: Monthly payment ÷ 2
- **Monthly**: Standard monthly payment
- **Quarterly**: Monthly payment × 3
- **Annually**: Monthly payment × 12

## Styling

The component uses Tailwind CSS classes and integrates with your existing design system. All UI components are from the shadcn/ui library.

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast tooltips

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Touch-friendly interface
