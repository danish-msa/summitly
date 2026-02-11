import { AmenityCategory } from './types';

export const MOCK_DATA: AmenityCategory[] = [
  {
    id: "schools",
    label: "Schools",
    filters: [
      { label: "All", count: 6 },
      { label: "Assigned", count: 4 },
      { label: "Elementary", count: 3 },
      { label: "Secondary", count: 3 },
      { label: "French Immersion", count: 2 },
    ],
    items: [
      {
        id: "1",
        name: "West Humber Collegiate Institute",
        type: "Public",
        rating: 7,
        walkTime: "7.59 mins",
        driveTime: "1.22 mins",
        distance: "810 m",
      },
      {
        id: "2",
        name: "West Humber Junior Middle School",
        type: "Public",
        rating: 5.7,
        walkTime: "8.91 mins",
        driveTime: "1.43 mins",
        distance: "950 m",
      },
      {
        id: "3",
        name: "Melody Village Junior School",
        type: "Public",
        walkTime: "15.00 mins",
        driveTime: "2.40 mins",
        distance: "1.6 km",
      },
      {
        id: "4",
        name: "ÉÉ Félix-Leclerc",
        type: "Public",
        rating: 7,
        walkTime: "45.66 mins",
        driveTime: "7.30 mins",
        distance: "4.87 km",
      },
      {
        id: "5",
        name: "Western Technical-Commercial School",
        type: "Public",
        rating: 5.4,
        walkTime: "109.22 mins",
        driveTime: "17.48 mins",
        distance: "11.65 km",
      },
    ],
  },
  {
    id: "parks",
    label: "Parks",
    filters: [
      { label: "All", count: 8 },
      { label: "Playgrounds", count: 5 },
      { label: "Dog Parks", count: 2 },
    ],
    items: [
      {
        id: "p1",
        name: "Humber Valley Park",
        type: "Public Park",
        walkTime: "12.00 mins",
        driveTime: "3.00 mins",
        distance: "1.2 km",
      },
      {
        id: "p2",
        name: "Riverside Park",
        type: "Community Park",
        walkTime: "8.00 mins",
        driveTime: "2.00 mins",
        distance: "850 m",
      },
    ],
  },
  {
    id: "safety",
    label: "Safety Zones",
    filters: [
      { label: "All", count: 4 },
      { label: "Fire Stations", count: 2 },
      { label: "Police Stations", count: 2 },
    ],
    items: [
      {
        id: "s1",
        name: "Fire Station 423",
        type: "Emergency Service",
        walkTime: "18.00 mins",
        driveTime: "4.50 mins",
        distance: "2.1 km",
      },
    ],
  },
  {
    id: "transit",
    label: "Transit Stops",
    filters: [
      { label: "All", count: 12 },
      { label: "Bus Stops", count: 8 },
      { label: "Subway", count: 4 },
    ],
    items: [
      {
        id: "t1",
        name: "Islington Station",
        type: "Subway Station",
        walkTime: "15.00 mins",
        driveTime: "5.00 mins",
        distance: "1.8 km",
      },
    ],
  },
];

