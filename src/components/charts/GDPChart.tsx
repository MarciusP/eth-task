import React from "react";
import Plot from "react-plotly.js";
import type { GDPDataPoint } from "../../types/gdp";

interface GDPChartProps {
  data: GDPDataPoint[];
}

const GDPChart: React.FC<GDPChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No GDP data available to display.</p>;
  }

  const traces = [];
  const countries = Array.from(new Set(data.map((item) => item.country_label)));

  for (const country of countries) {
    const countryData = data.filter((item) => item.country_label === country);
    traces.push({
      x: countryData.map((item) => item.year),
      y: countryData.map((item) => item.gdp),
      type: "bar" as const,
      name: country,
    });
  }

  return (
    <Plot
      data={traces}
      layout={{
        title: { text: "GDP Over Time by Country" },
        xaxis: { title: { text: "Year" } },
        yaxis: { title: { text: "GDP (Euros)" } },
        barmode: "group",
      }}
      style={{ width: "100%", height: "500px" }}
    />
  );
};

export default GDPChart;
