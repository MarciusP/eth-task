import React from "react";
import Plot from "react-plotly.js";
import type { GDPDataPoint, GDPSchema } from "../../types/gdp";

interface GDPChartProps {
  data: GDPDataPoint[];
  schema: GDPSchema | null;
}

const GDPChart: React.FC<GDPChartProps> = ({ data, schema }) => {
  if (!data || data.length === 0) {
    return <p>No GDP data available to display.</p>;
  }

  const traces = ["AT", "DE", "CH"].map((countryId) => {
    const countryData = data.filter((d) => d.country_id === countryId);
    return {
      x: countryData.map((d) => d.year),
      y: countryData.map((d) => d.gdp),
      name: countryId,
      type: "bar" as const,
    };
  });

  const chartTitle = schema?.title || "Gross Domestic Product";
  const yAxisTitle = `GDP (${schema?.valueField?.unit || 'Unknown Unit'})`;

  return (
    <Plot
      data={traces}
      layout={{
        title: { text: chartTitle },
        xaxis: {
          title: { text: "Year" },
          type: "category" as const,
        },
        yaxis: { title: { text: yAxisTitle } },
        barmode: "group" as const,
      }}
      style={{ width: "95%", height: "600px" }}
      config={{ responsive: true }}
    />
  );
};

export default GDPChart;
