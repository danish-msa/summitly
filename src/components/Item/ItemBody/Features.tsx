import React from 'react'

const features = [
    [
      "Smoke alarm",
      "Carbon monoxide alarm",
      "First aid kit",
      "Self check-in with lockbox",
      "Security cameras",
    ],
    [
      "Hangers",
      "Bed linens",
      "Extra pillows & blankets",
      "Iron",
      "TV with standard cable",
    ],
    ["Refrigerator", "Microwave", "Dishwasher", "Coffee maker"],
  ];

const Features = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
      {features.map((group, index) => (
        <div key={index}>
          <ul className="space-y-2">
            {group.map((item, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span className="text-gray-600 text-xs md:text-base">✔</span>
                <span className="text-gray-800 text-xs md:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default Features