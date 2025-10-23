import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Ruler, 
  Car, 
  Droplet, 
  Wind, 
  Zap,
  Building2,
  TrendingUp,
  History,
  Info
} from "lucide-react";

interface ListingDetailsProps {
  data: {
    keyFacts: Record<string, string | number>;
    listingHistory: Array<{
      dateStart: string;
      dateEnd: string;
      listPrice: string;
      price: string;
      event: string;
      listingId: string;
    }>;
    pricePrediction: {
      lower: number;
      mid: number;
      higher: number;
      confidence: number;
      appreciation: number;
      rentalIncome: number;
    };
    propertyDetails: {
      property: Record<string, string>;
      inside: Record<string, string | number>;
      utilities: Record<string, string>;
      building: Record<string, string>;
      parking: Record<string, string | number>;
      highlights: Record<string, string>;
      land: Record<string, string>;
    };
    rooms: Array<{
      name: string;
      dimensions: string;
      features: string[];
      level: string;
    }>;
    comparableSales: {
      count: number;
      medianPrice: number;
      avgDaysOnMarket: number;
    };
  };
}

export default function PropertyListingDetails({ data }: ListingDetailsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="w-full space-y-6">
      {/* Key Facts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Key Facts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data.keyFacts).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm text-muted-foreground">{key}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Prediction */}
      <Card className="bg-white border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Price Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center text-center p-4 bg-brand-cb-blue/20 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-2">Lower Range</p>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(data.pricePrediction.lower)}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4 bg-brand-tide rounded-lg border-2 border-primary">
              <p className="text-sm text-primary font-medium mb-2">Mid Range</p>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(data.pricePrediction.mid)}
              </p>
              <Badge variant="secondary" className="mt-2">
                Confidence: {data.pricePrediction.confidence}%
              </Badge>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-4 bg-brand-celestial/20 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-2">Higher Range</p>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(data.pricePrediction.higher)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Appreciation Since Last Sold</p>
              <p className="text-xl font-bold text-success">
                +{data.pricePrediction.appreciation}%
              </p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Est. Monthly Rental Income</p>
              <p className="text-xl font-bold">{formatPrice(data.pricePrediction.rentalIncome)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 h-12">
          <TabsTrigger value="details" className="py-2">Property Details</TabsTrigger>
          <TabsTrigger value="rooms" className="py-2">Rooms</TabsTrigger>
          <TabsTrigger value="history" className="py-2">Listing History</TabsTrigger>
          <TabsTrigger value="comparable" className="hidden lg:block py-2">
            Comparable Sales
          </TabsTrigger>
        </TabsList>

        {/* Property Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-4 w-4" />
                  Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(data.propertyDetails.property).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}:</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Building */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-4 w-4" />
                  Building
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(data.propertyDetails.building).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}:</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Inside */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="h-4 w-4" />
                  Inside
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(data.propertyDetails.inside).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}:</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Utilities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-4 w-4" />
                  Utilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(data.propertyDetails.utilities).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}:</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Parking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-4 w-4" />
                  Parking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(data.propertyDetails.parking).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}:</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Land */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4" />
                  Land
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(data.propertyDetails.land).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}:</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.propertyDetails.highlights).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="px-3 py-1">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.rooms.map((room, index) => (
                  <div
                    key={index}
                    className="p-4 bg-muted/30 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{room.name}</h4>
                        <p className="text-sm text-muted-foreground">{room.dimensions}</p>
                      </div>
                      <Badge variant="outline">{room.level}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {room.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-background px-2 py-1 rounded border"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listing History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Listing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Date Start
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Date End
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        List Price
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Price
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Event
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Listing ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.listingHistory.map((record, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm">{record.dateStart}</td>
                        <td className="py-3 px-4 text-sm">{record.dateEnd}</td>
                        <td className="py-3 px-4 text-sm font-medium">{record.listPrice}</td>
                        <td className="py-3 px-4 text-sm font-medium">{record.price}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              record.event === "Sold"
                                ? "default"
                                : record.event === "For Sale"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {record.event}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {record.listingId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparable Sales Tab */}
        <TabsContent value="comparable">
          <Card>
            <CardHeader>
              <CardTitle>Comparable Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Comparable Sales</p>
                  <p className="text-3xl font-bold">{data.comparableSales.count}</p>
                </div>
                <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="text-sm text-muted-foreground mb-2">Median Sale Price</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(data.comparableSales.medianPrice)}
                  </p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Avg. Days On Market</p>
                  <p className="text-3xl font-bold">{data.comparableSales.avgDaysOnMarket}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
