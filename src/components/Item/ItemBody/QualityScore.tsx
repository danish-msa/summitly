import React from 'react';

interface QualityScoreProps {
  overallScore: number; // 0-100 (from quantitative.overall)
  overallRating: string; // "excellent", "very good", etc. (from qualitative.overall)
  featureScores?: {
    livingRoom?: number;
    frontOfStructure?: number;
    kitchen?: number;
    diningRoom?: number;
    bathroom?: number;
    bedroom?: number;
  };
}

const QualityScore: React.FC<QualityScoreProps> = ({ 
  overallScore, 
  overallRating,
  featureScores 
}) => {
  // Calculate the percentage for the arc (0-100)
  // Convert score to percentage (assuming score is 0-5 scale, convert to 0-100)
  const percentage = Math.min(100, Math.max(0, (overallScore / 5) * 100));
  
  // Format the rating text
  const formatRating = (rating: string) => {
    return rating.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ').toUpperCase();
  };

  // Calculate arc path for semi-circle (starts from bottom-left, goes to bottom-right)
  const radius = 35;
  const circumference = Math.PI * radius; // Half circle circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="w-full">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Left Side: Score Arc and Rating */}
          <div className="flex flex-col items-center">
            {/* Quality Score Display with Semi-circular Arc */}
            <div className="relative w-24 h-16 mb-2 flex items-center justify-center">
              {/* SVG for Semi-circular Arc */}
              <svg 
                width="96" 
                height="56" 
                viewBox="0 0 96 56"
                className="absolute inset-0"
                style={{ overflow: 'visible' }}
              >
                {/* Background arc (gray) - full semi-circle */}
                <path
                  d="M 13 43 A 35 35 0 0 1 83 43"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Foreground arc (green) - animated based on score */}
                <path
                  d="M 13 43 A 35 35 0 0 1 83 43"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  style={{
                    transform: 'scaleX(1)',
                    transformOrigin: 'center'
                  }}
                />
              </svg>
              
              {/* Score Number - Centered below the arc */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <span className="text-xl font-bold text-gray-900">
                  {Math.round((overallScore / 5) * 100)}
                </span>
              </div>
            </div>

            {/* Rating Text */}
            <div className="text-xs font-semibold text-gray-900">
              {formatRating(overallRating)}
            </div>
          </div>

          {/* Right Side: Feature Breakdown (Optional) */}
          {featureScores && Object.keys(featureScores).length > 0 && (
            <div className="flex-1 w-full lg:w-auto">
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(featureScores).map(([feature, score]) => {
                  const featurePercentage = Math.min(100, Math.max(0, (score / 5) * 100));
                  return (
                    <div key={feature} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                      {/* Feature Name - Above */}
                      <span className="text-xs text-gray-600 capitalize whitespace-nowrap text-center">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {/* Score Bar - Below */}
                      <div className="w-full">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${featurePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QualityScore;

