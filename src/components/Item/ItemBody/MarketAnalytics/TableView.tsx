import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Table2, TrendingUp, Download, RefreshCw, BarChart3 } from "lucide-react";
import { MarketData, ListingsData, SoldPriceData } from './types';

interface TableViewProps {
  viewMode: "chart" | "table";
  marketData?: MarketData;
  listingsData?: ListingsData;
  soldPriceData?: SoldPriceData;
  onToggleView?: () => void;
  onDownload?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const TableView = ({ 
  viewMode, 
  marketData, 
  listingsData, 
  soldPriceData,
  onToggleView,
  onDownload,
  onRefresh,
  isRefreshing = false,
}: TableViewProps) => {
  if (viewMode === "chart") {
    return null;
  }

  return (
    <>
      {/* View Toggle Controls for Table View */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button
          variant="default"
          size="icon"
          onClick={onToggleView}
          className="h-9 w-9 rounded-lg transition-all duration-300"
          title="Switch to chart view"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {}}
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
      {/* Market Data Table */}
      {marketData && marketData.months.length > 0 && (
        <div className="w-full overflow-auto max-h-[500px] md:max-h-[600px] rounded-lg border border-border mb-8">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="text-right font-semibold">Median Sold Price</TableHead>
                <TableHead className="text-right font-semibold">Average Sold Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketData.months.map((month, index) => (
                <TableRow 
                  key={index} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{month}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-chart-price" />
                      ${marketData.prices[index].toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-chart-days" />
                      ${marketData.days[index].toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Listings Data Table */}
      {listingsData && listingsData.months.length > 0 && (
        <div className="w-full overflow-auto max-h-[400px] md:max-h-[500px] rounded-lg border border-border mb-8">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="text-right font-semibold">New Listings</TableHead>
                <TableHead className="text-right font-semibold">Closed Listings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listingsData.months.map((month, index) => (
                <TableRow 
                  key={index} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{month}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      {listingsData.newListings[index]} listings
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {listingsData.closedListings[index]} listings
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sold Price Data Table */}
      {soldPriceData && soldPriceData.months.length > 0 && (
        <div className="w-full overflow-auto max-h-[400px] md:max-h-[500px] rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="font-semibold text-right">Median Price</TableHead>
                <TableHead className="font-semibold text-right">Average Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {soldPriceData.months.map((month, index) => (
                <TableRow key={month}>
                  <TableCell className="font-medium">{month}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      ${(soldPriceData.medianPrices[index] / 1000).toFixed(0)}k
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      ${(soldPriceData.averagePrices[index] / 1000).toFixed(0)}k
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

