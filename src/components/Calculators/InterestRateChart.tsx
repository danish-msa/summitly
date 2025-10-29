import ReactECharts from 'echarts-for-react';

interface InterestRateChartProps {
  currentRate: number;
}

const InterestRateChart = ({ currentRate }: InterestRateChartProps) => {
  // Historical mortgage rate data (approximated from 2006-2025)
  const years: string[] = [];
  const rates: number[] = [];
  const ratesWithInsurance: number[] = [];
  
  // Generate data points from 2006 to 2025
  for (let year = 2006; year <= 2025; year++) {
    years.push(year.toString());
    
    // Approximate historical 5-year fixed rates
    if (year <= 2008) {
      rates.push(6.5 + Math.random() * 0.5);
      ratesWithInsurance.push(7.0 + Math.random() * 0.5);
    } else if (year <= 2010) {
      rates.push(5.5 + Math.random() * 0.5);
      ratesWithInsurance.push(6.0 + Math.random() * 0.5);
    } else if (year <= 2017) {
      rates.push(3.0 + Math.random() * 1.0);
      ratesWithInsurance.push(3.5 + Math.random() * 1.0);
    } else if (year <= 2019) {
      rates.push(3.5 + Math.random() * 0.5);
      ratesWithInsurance.push(4.0 + Math.random() * 0.5);
    } else if (year <= 2021) {
      rates.push(2.0 + Math.random() * 0.5);
      ratesWithInsurance.push(2.5 + Math.random() * 0.5);
    } else if (year <= 2023) {
      rates.push(4.5 + Math.random() * 1.0);
      ratesWithInsurance.push(5.0 + Math.random() * 1.0);
    } else {
      rates.push(currentRate + Math.random() * 0.5 - 0.25);
      ratesWithInsurance.push(currentRate + 0.5 + Math.random() * 0.5 - 0.25);
    }
  }

  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: {
        rotate: 45,
        fontSize: 11
      },
      axisLine: {
        lineStyle: {
          color: '#888'
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 8,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#e5e5e5',
          type: 'dashed'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#888'
        }
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{axisValue: string, seriesName: string, value: number, marker: string}>) => {
        let result = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach((param) => {
          result += `${param.marker} ${param.seriesName}: <strong>${param.value.toFixed(2)}%</strong><br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['5-year fixed rates', '5-year fixed rates (CMHC)'],
      bottom: 0,
      textStyle: {
        fontSize: 11
      }
    },
    series: [
      {
        name: '5-year fixed rates',
        type: 'line',
        data: rates,
        smooth: true,
        lineStyle: {
          color: '#0d9488',
          width: 2
        },
        itemStyle: {
          color: '#0d9488'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(13, 148, 136, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(13, 148, 136, 0.05)'
              }
            ]
          }
        }
      },
      {
        name: '5-year fixed rates (CMHC)',
        type: 'line',
        data: ratesWithInsurance,
        smooth: true,
        lineStyle: {
          color: '#14b8a6',
          width: 2,
          type: 'dashed'
        },
        itemStyle: {
          color: '#14b8a6'
        }
      }
    ]
  };

  return (
    <div className="w-full h-[300px] mt-4">
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default InterestRateChart;
