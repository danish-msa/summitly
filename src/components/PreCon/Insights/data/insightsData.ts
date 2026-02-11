// Mock data for pre-construction insights analytics
// In a real app, this would come from an API or data service

export interface Area {
  id: string;
  name: string;
  value: number;
}

export interface PriceDataPoint {
  year: number;
  price: number;
}

export interface CompletionsDataPoint {
  year: number;
  completions: number;
}

export const areas: Area[] = [
  { id: "gta", name: "Greater Toronto Area", value: 42996 },
  { id: "toronto", name: "Toronto", value: 23170 },
  { id: "mississauga", name: "Mississauga", value: 4973 },
  { id: "oakville", name: "Oakville", value: 3070 },
  { id: "vaughan", name: "Vaughan", value: 2566 },
  { id: "brampton", name: "Brampton", value: 2264 },
  { id: "milton", name: "Milton", value: 2194 },
];

// Area-specific price data
export const priceDataByArea: Record<string, PriceDataPoint[]> = {
  gta: [
    { year: 2016, price: 704 },
    { year: 2017, price: 844 },
    { year: 2018, price: 971 },
    { year: 2019, price: 1020 },
    { year: 2020, price: 1081 },
    { year: 2021, price: 1156 },
    { year: 2022, price: 1351 },
    { year: 2023, price: 1350 },
    { year: 2024, price: 1318 },
    { year: 2025, price: 1281 },
  ],
  toronto: [
    { year: 2016, price: 850 },
    { year: 2017, price: 980 },
    { year: 2018, price: 1120 },
    { year: 2019, price: 1180 },
    { year: 2020, price: 1250 },
    { year: 2021, price: 1380 },
    { year: 2022, price: 1580 },
    { year: 2023, price: 1570 },
    { year: 2024, price: 1520 },
    { year: 2025, price: 1480 },
  ],
  mississauga: [
    { year: 2016, price: 580 },
    { year: 2017, price: 680 },
    { year: 2018, price: 780 },
    { year: 2019, price: 820 },
    { year: 2020, price: 880 },
    { year: 2021, price: 950 },
    { year: 2022, price: 1120 },
    { year: 2023, price: 1110 },
    { year: 2024, price: 1080 },
    { year: 2025, price: 1050 },
  ],
  oakville: [
    { year: 2016, price: 720 },
    { year: 2017, price: 850 },
    { year: 2018, price: 980 },
    { year: 2019, price: 1030 },
    { year: 2020, price: 1090 },
    { year: 2021, price: 1160 },
    { year: 2022, price: 1360 },
    { year: 2023, price: 1350 },
    { year: 2024, price: 1320 },
    { year: 2025, price: 1290 },
  ],
  vaughan: [
    { year: 2016, price: 650 },
    { year: 2017, price: 760 },
    { year: 2018, price: 870 },
    { year: 2019, price: 920 },
    { year: 2020, price: 980 },
    { year: 2021, price: 1050 },
    { year: 2022, price: 1230 },
    { year: 2023, price: 1220 },
    { year: 2024, price: 1190 },
    { year: 2025, price: 1160 },
  ],
  brampton: [
    { year: 2016, price: 550 },
    { year: 2017, price: 640 },
    { year: 2018, price: 730 },
    { year: 2019, price: 770 },
    { year: 2020, price: 820 },
    { year: 2021, price: 880 },
    { year: 2022, price: 1020 },
    { year: 2023, price: 1010 },
    { year: 2024, price: 990 },
    { year: 2025, price: 960 },
  ],
  milton: [
    { year: 2016, price: 520 },
    { year: 2017, price: 610 },
    { year: 2018, price: 700 },
    { year: 2019, price: 740 },
    { year: 2020, price: 790 },
    { year: 2021, price: 850 },
    { year: 2022, price: 990 },
    { year: 2023, price: 980 },
    { year: 2024, price: 960 },
    { year: 2025, price: 930 },
  ],
};

// Area-specific completions data
export const completionsDataByArea: Record<string, CompletionsDataPoint[]> = {
  gta: [
    { year: 2021, completions: 20900 },
    { year: 2022, completions: 18700 },
    { year: 2023, completions: 21900 },
    { year: 2024, completions: 38200 },
    { year: 2025, completions: 43000 },
    { year: 2026, completions: 27700 },
    { year: 2027, completions: 22700 },
    { year: 2028, completions: 20000 },
    { year: 2029, completions: 4200 },
    { year: 2030, completions: 773 },
  ],
  toronto: [
    { year: 2021, completions: 12000 },
    { year: 2022, completions: 10500 },
    { year: 2023, completions: 12500 },
    { year: 2024, completions: 22000 },
    { year: 2025, completions: 25000 },
    { year: 2026, completions: 16000 },
    { year: 2027, completions: 13000 },
    { year: 2028, completions: 11500 },
    { year: 2029, completions: 2400 },
    { year: 2030, completions: 450 },
  ],
  mississauga: [
    { year: 2021, completions: 2500 },
    { year: 2022, completions: 2200 },
    { year: 2023, completions: 2600 },
    { year: 2024, completions: 4500 },
    { year: 2025, completions: 5000 },
    { year: 2026, completions: 3200 },
    { year: 2027, completions: 2600 },
    { year: 2028, completions: 2300 },
    { year: 2029, completions: 500 },
    { year: 2030, completions: 100 },
  ],
  oakville: [
    { year: 2021, completions: 1500 },
    { year: 2022, completions: 1350 },
    { year: 2023, completions: 1600 },
    { year: 2024, completions: 2800 },
    { year: 2025, completions: 3100 },
    { year: 2026, completions: 2000 },
    { year: 2027, completions: 1600 },
    { year: 2028, completions: 1400 },
    { year: 2029, completions: 300 },
    { year: 2030, completions: 60 },
  ],
  vaughan: [
    { year: 2021, completions: 1300 },
    { year: 2022, completions: 1150 },
    { year: 2023, completions: 1350 },
    { year: 2024, completions: 2400 },
    { year: 2025, completions: 2700 },
    { year: 2026, completions: 1750 },
    { year: 2027, completions: 1400 },
    { year: 2028, completions: 1200 },
    { year: 2029, completions: 250 },
    { year: 2030, completions: 50 },
  ],
  brampton: [
    { year: 2021, completions: 1150 },
    { year: 2022, completions: 1000 },
    { year: 2023, completions: 1200 },
    { year: 2024, completions: 2100 },
    { year: 2025, completions: 2300 },
    { year: 2026, completions: 1500 },
    { year: 2027, completions: 1200 },
    { year: 2028, completions: 1050 },
    { year: 2029, completions: 220 },
    { year: 2030, completions: 45 },
  ],
  milton: [
    { year: 2021, completions: 1100 },
    { year: 2022, completions: 950 },
    { year: 2023, completions: 1150 },
    { year: 2024, completions: 2000 },
    { year: 2025, completions: 2200 },
    { year: 2026, completions: 1420 },
    { year: 2027, completions: 1150 },
    { year: 2028, completions: 1000 },
    { year: 2029, completions: 210 },
    { year: 2030, completions: 40 },
  ],
};

