import { RatingBar } from "./RatingBar";

interface RatingData {
  label: string;
  rating: number;
}

const ratingsData: RatingData[] = [
  { label: "Overall", rating: 4.96 },
  { label: "Bedroom", rating: 2.96 },
  { label: "Kitchen", rating: 3.97 },
  { label: "Living Room", rating: 4.52 },
];

export const RatingsOverview = () => {
  return (
    <div className="max-w-xl w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {ratingsData.map((item) => (
          <RatingBar key={item.label} label={item.label} rating={item.rating} />
        ))}
      </div>
    </div>
  );
};

export default RatingsOverview;
