interface ChartSectionHeaderProps {
  title: string;
  description: string;
  isLoading: boolean;
  usingAPIData: boolean;
  apiError: string | null;
}

export const ChartSectionHeader = ({
  title,
  description,
  isLoading,
  usingAPIData,
  apiError,
}: ChartSectionHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h3 className="text-xl md:text-2xl font-bold text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
          <div className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {isLoading ? 'Loading...' : usingAPIData ? 'Live Data' : 'Sample Data'}
          </div>
          {apiError && (
            <div className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              {apiError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

