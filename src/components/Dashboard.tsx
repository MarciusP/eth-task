import React, { useState, useEffect, useContext } from "react";
import GDPChart from "./charts/GDPChart";
import ElectricityChart from "./charts/ElectricityChart";
import { NavigationContext } from "../context/NavigationContext";
import {
  loadGDPData,
  loadGDPSchema,
  loadElectricityData,
  loadElectricitySchema,
} from "../services/dataLoader";
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

        const [gdp, gdpSch, electricity, electricitySch] = await Promise.all([
          loadGDPData(),
          loadGDPSchema(),
          loadElectricityData(),
          loadElectricitySchema(),
        ]);

        setGdpData(gdp);
        if (gdpSch) setGdpSchema(gdpSch as GDPSchema);
        setGdpAvailable(gdp.length > 0 && !!gdpSch);

        setElectricityData(electricity);
        if (electricitySch) setElectricitySchema(electricitySch as GenerationSchema);
        setElectricityAvailable(!!electricitySch);
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
          {currentPage === "gdp" && (
            <div>
              {gdpData.length > 0 && gdpSchema ? (
                <GDPChart data={gdpData} />
              ) : (
                <p>GDP data is currently unavailable or still loading.</p>
              )}
            </div>
          )}
          {currentPage === "electricity" && (
            <div>
              {electricitySchema ? (
                <ElectricityChart data={electricityData} />
              ) : (
                <p>Electricity data is currently unavailable or still loading.</p>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Dashboard;
