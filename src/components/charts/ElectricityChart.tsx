import React, { useState, useMemo } from "react";
import Plot from "react-plotly.js";
import type { GenerationDataPoint } from "../../types/generation";

interface ElectricityChartProps {
  data: GenerationDataPoint[];
  // schema?: GenerationSchema | null; // Schema can be used for titles, descriptions etc. later
}

type AggregationLevel = "monthly" | "daily" | "yearly";

const ElectricityChart: React.FC<ElectricityChartProps> = ({ data }) => {
  const [aggregationLevel, setAggregationLevel] =
    useState<AggregationLevel>("monthly");

  // Memoize the processed data to avoid re-computation on every render unless data or aggregationLevel changes
  const processedPlotData = useMemo(() => {
    if (!data || data.length === 0) {
      return null; // Or some indicator for no data to plot
    }

    const germanData = data.filter((d) => d.country_id === "DE");
    if (germanData.length === 0) {
      return null; // Or indicator for no German data
    }

    const aggregatedData: {
      [period: string]: { [technology: string]: number };
    } = {};

    germanData.forEach((d) => {
      const dateObj = new Date(Number(d.datetime));
      let periodKey = "";
      if (aggregationLevel === "monthly") {
        const year = dateObj.getUTCFullYear();
        const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
        periodKey = `${year}-${month}`;
      } else if (aggregationLevel === "daily") {
        periodKey = dateObj.toISOString().split("T")[0];
      } else {
        // yearly
        periodKey = dateObj.getUTCFullYear().toString();
      }

      if (!aggregatedData[periodKey]) {
        aggregatedData[periodKey] = {};
      }
      if (!aggregatedData[periodKey][d.technology]) {
        aggregatedData[periodKey][d.technology] = 0;
      }
      aggregatedData[periodKey][d.technology] += d.generation;
    });

    const periods = Object.keys(aggregatedData).sort();
    const technologies = Array.from(
      new Set(germanData.map((d) => d.technology))
    ).sort();

    return technologies.map((tech) => ({
      x: periods,
      y: periods.map((period) => aggregatedData[period][tech] || 0),
      name: tech,
      type: "bar" as const,
    }));
  }, [data, aggregationLevel]);

  if (!data || data.length === 0) {
    return (
      <p>
        Electricity Generation data is currently being loaded or is unavailable.
        Please ensure the backend/Parquet parsing is functional if this
        persists.
      </p>
    );
  }

  if (!processedPlotData) {
    return (
      <p>
        No Electricity Generation data available for Germany (DE) for the
        selected period or filters.
      </p>
    );
  }

  const getTitleAndXAxis = () => {
    let title = "Electricity Generation by Technology in Germany (DE)";
    let xAxisTitle = "Period";
    if (aggregationLevel === "monthly") {
      title = "Monthly " + title;
      xAxisTitle = "Month";
    } else if (aggregationLevel === "daily") {
      title = "Daily " + title;
      xAxisTitle = "Date";
    } else {
      title = "Yearly " + title;
      xAxisTitle = "Year";
    }
    return { chartTitle: title, xAxisLabel: xAxisTitle };
  };

  const { chartTitle, xAxisLabel } = getTitleAndXAxis();

  return (
    <div>
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <button
          onClick={() => setAggregationLevel("daily")}
          disabled={aggregationLevel === "daily"}
        >
          Daily
        </button>
        <button
          onClick={() => setAggregationLevel("monthly")}
          disabled={aggregationLevel === "monthly"}
          style={{ marginLeft: "10px" }}
        >
          Monthly
        </button>
        <button
          onClick={() => setAggregationLevel("yearly")}
          disabled={aggregationLevel === "yearly"}
          style={{ marginLeft: "10px" }}
        >
          Yearly
        </button>
      </div>
      <Plot
        data={processedPlotData as any}
        layout={{
          title: { text: chartTitle },
          xaxis: {
            title: { text: xAxisLabel },
            type: "date" as const, // Plotly handles YYYY, YYYY-MM, YYYY-MM-DD as dates
          },
          yaxis: { title: { text: "Generation (MWh)" } },
          barmode: "stack" as const,
        }}
        style={{ width: "100%", height: "600px" }}
        config={{ responsive: true }}
      />
    </div>
  );
};

export default ElectricityChart;
