import { MortgageCalculator } from '@/components/Calculator';

export default function CalculatorDemo() {
  return (
    <div>
      {/* Example 1: Default calculator */}
      <MortgageCalculator />
      
      {/* Example 2: Calculator with custom initial values */}
      <MortgageCalculator 
        initialHomePrice={750000}
        initialLocation="Vancouver, BC"
        className="mt-8"
      />
      
      {/* Example 3: Compact calculator for sidebar */}
      <div className="max-w-md mx-auto mt-8">
        <MortgageCalculator 
          initialHomePrice={500000}
          initialLocation="Calgary, AB"
          className="py-4"
        />
      </div>
    </div>
  );
}
