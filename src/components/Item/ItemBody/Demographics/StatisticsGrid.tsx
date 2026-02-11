import { DemographicStats } from './types';
import { Users, Calendar, DollarSign, Home, UsersRound, User, Baby, Briefcase } from 'lucide-react';

interface StatisticsGridProps {
  stats: DemographicStats;
}

export const StatisticsGrid = ({ stats }: StatisticsGridProps) => {
  const statistics = [
    {
      icon: Users,
      label: 'Population (2021)',
      value: stats.population,
      color: 'text-blue-600'
    },
    {
      icon: Calendar,
      label: 'Average Age',
      value: stats.averageAge,
      color: 'text-purple-600'
    },
    {
      icon: DollarSign,
      label: 'Average Household Income',
      value: `$${stats.averageIncome.toLocaleString()}`,
      color: 'text-green-600'
    },
    {
      icon: Home,
      label: 'Renters',
      value: `${stats.renters}%`,
      color: 'text-orange-600'
    },
    {
      icon: UsersRound,
      label: 'Household Average Size',
      value: stats.householdSize,
      color: 'text-pink-600'
    },
    {
      icon: User,
      label: 'Single',
      value: `${stats.single}%`,
      color: 'text-indigo-600'
    },
    {
      icon: Baby,
      label: 'Households With Children',
      value: stats.householdsWithChildren,
      color: 'text-cyan-600'
    },
    {
      icon: Briefcase,
      label: 'Not in Labour Force',
      value: `${stats.notInLabourForce}%`,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
      {statistics.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="flex items-center gap-2 p-2">
            <div className={`flex-shrink-0 ${stat.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

