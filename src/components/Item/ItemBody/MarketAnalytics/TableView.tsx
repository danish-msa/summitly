import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarketData, ListingsData, SoldPriceData } from './types';

interface TableViewProps {
  viewMode: "chart" | "table";
  marketData?: MarketData;
  listingsData?: ListingsData;
  soldPriceData?: SoldPriceData;
}

export const TableView = ({ viewMode, marketData, listingsData, soldPriceData }: TableViewProps) => {
  if (viewMode === "chart") {
    return null;
  }

  return (
    <>
      {/* Market Data Table */}
      {marketData && marketData.months.length > 0 && (
        <div className="w-full overflow-auto max-h-[500px] md:max-h-[600px] rounded-lg border border-border mb-8">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="text-right font-semibold">Median Sold Price</TableHead>
                <TableHead className="text-right font-semibold">Average Days On Market</TableHead>
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
                      {marketData.days[index].toFixed(0)} days
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
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
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

