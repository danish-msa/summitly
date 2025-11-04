import { DemographicStats } from './types';

interface StatisticsGridProps {
  stats: DemographicStats;
}

export const StatisticsGrid = ({ stats }: StatisticsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
        <p className="text-sm text-muted-foreground mb-1">Population (2021):</p>
        <p className="text-2xl font-bold text-foreground">{stats.population}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
        <p className="text-sm text-muted-foreground mb-1">Average Age:</p>
        <p className="text-2xl font-bold text-foreground">{stats.averageAge}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
        <p className="text-sm text-muted-foreground mb-1">Average Household Income:</p>
        <p className="text-2xl font-bold text-foreground">${stats.averageIncome.toLocaleString()}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
        <p className="text-sm text-muted-foreground mb-1">Renters:</p>
        <p className="text-2xl font-bold text-foreground">{stats.renters}%</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
        <p className="text-sm text-muted-foreground mb-1">Household Average Size:</p>
        <p className="text-2xl font-bold text-foreground">{stats.householdSize}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
        <p className="text-sm text-muted-foreground mb-1">Single:</p>
        <p className="text-2xl font-bold text-foreground">{stats.single}%</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
        <p className="text-sm text-muted-foreground mb-1">Households With Children:</p>
        <p className="text-2xl font-bold text-foreground">{stats.householdsWithChildren}</p>
      </div>
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-all">
        <p className="text-sm text-muted-foreground mb-1">Not in Labour Force:</p>
        <p className="text-2xl font-bold text-foreground">{stats.notInLabourForce}%</p>
      </div>
    </div>
  );
};

