import { Download, Table2, TrendingUp, RefreshCw, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ProcessedLocation } from "@/data/types";
import { getLocationName, getPropertyClassLabel } from './dataGenerators';

interface HeaderSectionProps {
  propertyAddress: string;
  propertyClass: string;
  locationData: ProcessedLocation | null;
  viewMode: "chart" | "table";
  onToggleView: () => void;
  onRefresh: () => void;
  onDownload: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
  usingAPIData: boolean;
  apiError: string | null;
}

export const HeaderSection = ({
  propertyAddress,
  propertyClass,
  locationData,
  viewMode,
  onToggleView,
  onRefresh,
  onDownload,
  isRefreshing,
  isLoading,
  usingAPIData,
  apiError,
}: HeaderSectionProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between my-10 gap-4">
      <div>
        <p className="text-sm text-muted-foreground font-medium mb-1">
          {getLocationName(locationData, propertyAddress)} • {getPropertyClassLabel(propertyClass)}
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Median Sold Price & Average Sold Price last 12 months
        </h2>
        <div className="mt-2 flex items-center gap-4">
          {locationData && (
            <div className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-4">
                <span>Total Properties: {locationData.demographics.total}</span>
                <span>Residential: {locationData.demographics.residential}</span>
                <span>Condo: {locationData.demographics.condo}</span>
                <span>Commercial: {locationData.demographics.commercial}</span>
              </span>
            </div>
          )}
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
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "table" ? "default" : "outline"}
          size="icon"
          onClick={onToggleView}
          className="h-9 w-9 rounded-lg transition-all duration-300"
          title={viewMode === "chart" ? "Switch to table view" : "Switch to chart view"}
        >
          {viewMode === "chart" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => toast.info("Trend analysis coming soon!")}
          className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          title="Trend analysis"
        >
          <TrendingUp className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDownload}
          className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          title="Download data"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 w-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

