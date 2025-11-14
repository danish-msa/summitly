import { PropertyListing } from '@/lib/types';

export interface NeighbourhoodData {
  rank: number;
  name: string;
  soldUnder10d: number; // percentage
  soldAboveAsking: number; // percentage
  averageSalePrice: number;
  activeListings: number;
}

// Generate mock neighbourhood data when no properties are available
export const generateMockNeighbourhoodData = (): {
  hottest: NeighbourhoodData[];
  coldest: NeighbourhoodData[];
  all: NeighbourhoodData[];
  totalCount: number;
} => {
  // Expanded list of 143 unique neighbourhoods (Toronto and GTA areas)
  const allNeighbourhoodNames = [
    'Blake-Jones', 'Rosedale', 'Yorkville', 'Annex', 'Beaches', 'Leslieville',
    'Riverdale', 'Cabbagetown', 'Distillery District', 'Entertainment District',
    'Financial District', 'Harbourfront', 'King West', 'Queen West', 'Trinity-Bellwoods',
    'Little Italy', 'Kensington Market', 'Chinatown', 'Greektown', 'Little Portugal',
    'High Park', 'Bloor West Village', 'Junction', 'Roncesvalles', 'Parkdale',
    'Liberty Village', 'Fort York', 'CityPlace', 'St. Lawrence', 'Corktown',
    'Regent Park', 'Moss Park', 'Garden District', 'Church-Wellesley', 'Yonge-St. Clair',
    'Summerhill', 'Forest Hill', 'Casa Loma', 'Davenport', 'Dufferin Grove',
    'Brockton', 'Dovercourt', 'Dundas West', 'Ossington', 'Christie Pits',
    'Seaton Village', 'Palmerston', 'Wychwood', 'Hillcrest', 'Moore Park',
    'Leaside', 'Davisville', 'Mount Pleasant', 'North Toronto', 'Lawrence Park',
    'Bedford Park', 'Bridle Path', 'Don Mills', 'Flemingdon Park', 'Thorncliffe Park',
    'East York', 'Danforth', 'The Beaches', 'Woodbine Heights', 'Main Square',
    'Upper Beaches', 'Greenwood-Coxwell', 'Danforth Village', 'Playter Estates',
    'South Riverdale', 'Riverside', 'East Chinatown', 'Canary District', 'West Don Lands',
    'Old Town', 'Harbourfront West', 'Bathurst Quay', 'Niagara', 'St. James Town',
    'Deer Park', 'Corso Italia', 'Dufferin', 'Lansdowne', 'Dupont',
    'Dovercourt Park', 'Wallace Emerson', 'Junction Triangle', 'Weston', 'Mount Dennis',
    'Keelesdale', 'Eglinton West', 'Caledonia-Fairbank', 'Yorkdale-Glen Park', 'Englemount-Lawrence',
    'Bathurst Manor', 'Downsview', 'Willowdale', 'Newtonbrook', 'Bayview Village',
    'Don Valley Village', 'Pleasant View', 'Henry Farm', 'Bennington Heights',
    'Agincourt', 'Malvern', 'Milliken', 'Steeles', 'Tam O\'Shanter-Sullivan',
    'Woburn', 'Birch Cliff', 'Cliffside', 'Cliffcrest', 'Guildwood',
    'Highland Creek', 'Morningside', 'Rouge', 'West Hill', 'Centennial Scarborough',
    'Clairlea-Birchmount', 'Kennedy Park', 'Oakridge', 'Wexford-Maryvale', 'Cedarbrae',
    'Eglinton East', 'Ionview', 'Knob Hill', 'Oakwood Village', 'Weston-Pellam Park',
    'Humber Summit', 'Humbermede', 'Pelmo Park-Humberlea', 'Black Creek', 'Glenfield-Jane Heights',
    'Humberlea', 'Humberwood', 'Rexdale', 'Thistletown-Beaumond Heights', 'West Humber-Clairville',
    'Alderwood', 'Long Branch', 'Mimico', 'New Toronto', 'Stonegate-Queensway',
    'Swansea', 'The Queensway-Humber Bay', 'Willowridge-Martingrove-Richview', 'Etobicoke West Mall', 'Islington-City Centre West',
    'Kingsway South', 'Kingsview Village-The Westway', 'Princess-Rosethorn', 'Eringate-Centennial-West Deane', 'Markland Wood',
    'Edenbridge-Humber Valley', 'Humber Heights-Westmount', 'Lambton Baby Point', 'Runnymede-Bloor West Village', 'St. Clair Gardens',
    'Earlscourt', 'Oakwood-Vaughan', 'Humberlea Heights', 'Humberwood Heights', 'Rexdale Heights',
    'Thistletown', 'Beaumond Heights', 'West Humber', 'Clairville', 'Alderwood Heights',
    'Long Branch Heights', 'Mimico North', 'New Toronto West', 'Stonegate', 'Queensway',
    'Swansea Heights', 'The Queensway', 'Humber Bay', 'Willowridge', 'Martingrove',
    'Richview', 'Etobicoke', 'West Mall', 'Islington', 'City Centre West',
    'Kingsway', 'South Kingsway', 'Kingsview Village', 'The Westway', 'Princess',
    'Rosethorn', 'Eringate', 'Centennial', 'West Deane', 'Markland',
    'Wood', 'Edenbridge', 'Humber Valley', 'Humber Heights', 'Westmount',
    'Lambton', 'Baby Point', 'Runnymede', 'Bloor West', 'St. Clair',
    'Gardens', 'Corso Italia', 'Davenport West', 'Dufferin North', 'Earlscourt West'
  ];
  
  // Remove duplicates and ensure we have exactly 143
  const uniqueNames = Array.from(new Set(allNeighbourhoodNames));
  const neighbourhoodNames = uniqueNames.length >= 143 
    ? uniqueNames.slice(0, 143)
    : [...uniqueNames, ...Array(143 - uniqueNames.length).fill(null).map((_, i) => `Neighbourhood ${uniqueNames.length + i + 1}`)];

  // Generate realistic data for each neighbourhood
  const generateData = (): NeighbourhoodData[] => {
    return neighbourhoodNames.map((name, index) => {
      const isHotArea = index < 30;
      const isColdArea = index >= neighbourhoodNames.length - 30;
      
      let soldUnder10d: number;
      let soldAboveAsking: number;
      
      if (isHotArea) {
        soldUnder10d = Math.round(60 + Math.random() * 30);
        soldAboveAsking = Math.round(50 + Math.random() * 35);
      } else if (isColdArea) {
        soldUnder10d = Math.round(10 + Math.random() * 30);
        soldAboveAsking = Math.round(5 + Math.random() * 30);
      } else {
        soldUnder10d = Math.round(30 + Math.random() * 40);
        soldAboveAsking = Math.round(20 + Math.random() * 40);
      }

      const basePrice = 600000 + (index * 15000) + (Math.random() * 200000);
      const averageSalePrice = Math.round(Math.min(basePrice, 3500000));
      const activeListings = Math.round(3 + Math.random() * 42);

      return {
        rank: index + 1,
        name,
        soldUnder10d,
        soldAboveAsking,
        averageSalePrice,
        activeListings
      };
    });
  };

  const allData = generateData();
  
  const hottest = [...allData]
    .sort((a, b) => {
      const scoreA = a.soldUnder10d * 0.6 + a.soldAboveAsking * 0.4;
      const scoreB = b.soldUnder10d * 0.6 + b.soldAboveAsking * 0.4;
      return scoreB - scoreA;
    })
    .slice(0, 20)
    .map((n, index) => ({ ...n, rank: index + 1 }));

  const coldest = [...allData]
    .sort((a, b) => {
      const scoreA = a.soldUnder10d * 0.6 + a.soldAboveAsking * 0.4;
      const scoreB = b.soldUnder10d * 0.6 + b.soldAboveAsking * 0.4;
      return scoreA - scoreB;
    })
    .slice(0, 20)
    .map((n, index) => ({ ...n, rank: index + 1 }));

  const all = [...allData]
    .sort((a, b) => b.averageSalePrice - a.averageSalePrice)
    .map((n, index) => ({ ...n, rank: index + 1 }));

  return {
    hottest,
    coldest,
    all,
    totalCount: allData.length
  };
};

