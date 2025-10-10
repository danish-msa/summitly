"use client";

import { useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const Demographics = () => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Data categories
  const demographics = [
    { label: "0 to 14", value: 452, color: "#07364B" },
    { label: "15 to 19", value: 380, color: "#018484" },
    { label: "20 to 34", value: 720, color: "#E8194B" },
    { label: "35 to 49", value: 580, color: "#25BEBE" },
    { label: "50 to 64", value: 480, color: "#5E7387" },
    { label: "65 plus", value: 340, color: "#186685" },
  ];

  // Calculate total population
  const totalPopulation = demographics.reduce((sum, item) => sum + item.value, 0);

  // Chart.js data
  const chartData = {
    labels: demographics.map((d) => d.label),
    datasets: [
      {
        data: demographics.map((d) => d.value),
        backgroundColor: demographics.map((d, index) =>
          hoverIndex === index ? "#FFD700" : d.color
        ),
        hoverBackgroundColor: "#FFD700",
        borderWidth: 2,
        borderColor: "#fff",
        cutout: "70%", // Makes the chart a donut (wheel)
      },
    ],
  };

  // Chart options with a plugin for center text
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      title: {
        display: false,
        text: "Demographics",
        font: { size: 18 },
      },
    },
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 p-6">
      {/* Chart on the Left */}
      <div className="relative w-[70%] md:w-1/3">
        <Doughnut data={chartData} options={options} />

        {/* Center Text for Total Population */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-gray-500 text-sm">Total Population</p>
          <p className="text-xl font-bold text-gray-800">{totalPopulation.toLocaleString()}</p>
        </div>
      </div>

      {/* Information on the Right */}
      <div className="md:w-2/3 grid grid-cols-2 gap-4">
        {demographics.map((item, index) => (
          <div
            key={index}
            className={`p-2 border-l-4 ${
              hoverIndex === index ? "border-yellow-400 bg-gray-100" : "border-transparent"
            }`}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <h3 className="text-lg font-normal text-gray-800">{item.label}</h3>
            <p className="text-gray-600">Population: {item.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Demographics;
