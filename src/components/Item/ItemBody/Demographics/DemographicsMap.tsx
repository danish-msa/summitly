import Map from "@/components/ui/map";

interface DemographicsMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
}

export const DemographicsMap = ({ latitude, longitude, address }: DemographicsMapProps) => {
  return (
    <div className="w-full rounded-lg mb-6">
      <div className="text-center text-muted-foreground">
        <Map 
          latitude={latitude || undefined} 
          longitude={longitude || undefined}
          address={address}
          height="256px"
          width="100%"
          zoom={16}
          showControls={true}
          showFullscreen={true}
          showExternalLink={true}
          showMarker={true}
          loading={false}
        />
      </div>
    </div>
  );
};

