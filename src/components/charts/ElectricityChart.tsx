import React from 'react';
import Plot from 'react-plotly.js';
import type { GenerationDataPoint } from '../../types/generation';

interface ElectricityChartProps {
  data: GenerationDataPoint[];
}

const ElectricityChart: React.FC<ElectricityChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No Electricity Generation data available to display.</p>;
  }

  // TODO: Transform data for Plotly 
  // (e.g., group by country/technology, prepare for stacked bar chart)
  // Example: Simple bar chart of total generation per technology for the first country
  const firstCountryData = data.filter(d => d.country_id === data[0].country_id);
  
  const technologies = Array.from(new Set(firstCountryData.map(d => d.technology)));
  const plotData = technologies.map(tech => ({
    x: firstCountryData.filter(d => d.technology === tech).map(d => d.datetime), // This will need proper datetime handling
    y: firstCountryData.filter(d => d.technology === tech).map(d => d.generation),
    type: 'bar' as const,
    name: tech,
  }));

  return (
    <Plot
      data={plotData as any} // Using 'as any' for now, proper PlotlyDataType[] will be needed
      layout={{
        title: { text: 'Electricity Generation Over Time' },
        xaxis: { title: { text: 'Time' } }, // Consider type: 'date' for xaxis
        yaxis: { title: { text: 'Generation (MWh)' } },
        barmode: 'stack', // For stacked bar chart
      }}
      style={{ width: '100%', height: '400px' }}
    />
  );
};

export default ElectricityChart; 