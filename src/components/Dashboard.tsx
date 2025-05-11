import React, { useState, useEffect, useContext } from "react";
import GDPChart from "./charts/GDPChart";
import ElectricityChart from "./charts/ElectricityChart";
import { NavigationContext } from "../context/NavigationContext";
import { loadGDPData, loadGDPSchema } from "../services/dataLoader";
import type { GDPDataPoint, GDPSchema } from "../types/gdp";
import type {
  GenerationDataPoint,
  GenerationSchema,
} from "../types/generation";

const Dashboard: React.FC = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      "Dashboard must be used within a NavigationContextProvider"
    );
  }
  const { currentPage, setGdpAvailable, setElectricityAvailable } = context;

  const [gdpData, setGdpData] = useState<GDPDataPoint[]>([]);
  const [gdpSchema, setGdpSchema] = useState<GDPSchema | null>(null);
  const [electricityData, setElectricityData] = useState<GenerationDataPoint[]>(
    []
  );
  const [electricitySchema, setElectricitySchema] =
    useState<GenerationSchema | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setGdpAvailable(false);
        setElectricityAvailable(false);

        const [gdp, gdpSch] = await Promise.all([
          loadGDPData(),
          loadGDPSchema(),
        ]);

        setGdpData(gdp);
        if (gdpSch) setGdpSchema(gdpSch as GDPSchema);
        setGdpAvailable(gdp.length > 0 || !!gdpSch);

        setElectricityData([]);
        setElectricitySchema(null);
        setElectricityAvailable(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setGdpAvailable, setElectricityAvailable]);

  return (
    <main className="main-content">
      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="charts-container">
          {currentPage === "gdp" && gdpSchema && (
            <div>
              <GDPChart data={gdpData} />
            </div>
          )}
          {currentPage === "electricity" && electricitySchema && (
            <div>
              <ElectricityChart data={electricityData} />
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Dashboard;
