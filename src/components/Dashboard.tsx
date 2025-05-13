import React, { useState, useEffect, useContext, useRef } from "react";
import GDPChart from "./charts/GDPChart";
import ElectricityChart from "./charts/ElectricityChart";
import { NavigationContext } from "../context/NavigationContext";
import {
  loadGDPData,
  loadGDPSchema,
  loadElectricityData,
  loadElectricitySchema,
} from "../services/dataLoader";
import type { ElectricityDataWorkerResponse } from "../services/dataLoader";
import type { GDPDataPoint, GDPSchema } from "../types/gdp";
import type { GenerationSchema } from "../types/generation";
import type { ParseSuccessMessage } from "../workers/workerTypes";

const Dashboard: React.FC = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      "Dashboard must be used within a NavigationContextProvider"
    );
  }
  const {
    currentPage,
    setGdpAvailable,
    setElectricityAvailable,
    electricityAvailable,
  } = context;

  const [gdpData, setGdpData] = useState<GDPDataPoint[]>([]);
  const [gdpSchema, setGdpSchema] = useState<GDPSchema | null>(null);

  const electricityWorkerRef = useRef<Worker | null>(null);
  const [electricityMetadata, setElectricityMetadata] =
    useState<ParseSuccessMessage | null>(null);
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
        setElectricityMetadata(null);

        const gdpPromise = loadGDPData();
        const gdpSchPromise = loadGDPSchema();

        const electricityPromise = loadElectricityData();
        const electricitySchPromise = loadElectricitySchema();

        const [gdp, gdpSch, electricityResponse, electricitySch] =
          await Promise.allSettled([
            gdpPromise,
            gdpSchPromise,
            electricityPromise,
            electricitySchPromise,
          ]);

        if (gdp.status === "fulfilled") {
          setGdpData(gdp.value);
          setGdpAvailable(gdp.value.length > 0);
        } else {
          console.error("Failed to load GDP data:", gdp.reason);
          setError((prev) =>
            prev ? `${prev}; GDP data error` : "GDP data error"
          );
        }
        if (gdpSch.status === "fulfilled" && gdpSch.value) {
          setGdpSchema(gdpSch.value);
        }

        if (electricityResponse.status === "fulfilled") {
          const { worker, initialData } =
            electricityResponse.value as ElectricityDataWorkerResponse;
          electricityWorkerRef.current = worker;
          setElectricityMetadata(initialData);
          setElectricityAvailable(true);
        } else {
          console.error(
            "Failed to load electricity data or init worker:",
            electricityResponse.reason
          );
          setError((prev) =>
            prev ? `${prev}; Electricity data error` : "Electricity data error"
          );
          setElectricityAvailable(false);
        }
        if (electricitySch.status === "fulfilled" && electricitySch.value) {
          setElectricitySchema(electricitySch.value);
        }
      } catch (err) {
        console.error(
          "An unexpected error occurred during data fetching setup:",
          err
        );
        setError(
          err instanceof Error ? err.message : "An unknown setup error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (electricityWorkerRef.current) {
        electricityWorkerRef.current.terminate();
        electricityWorkerRef.current = null;
      }
    };
  }, [setGdpAvailable, setElectricityAvailable]);

  return (
    <main className="main-content">
      {loading && (
        <p>
          Loading data (Electricity data parsing may take a moment in
          background)...
        </p>
      )}
      {error && <p style={{ color: "red" }}>Error loading data: {error}</p>}

      {!loading && !error && (
        <div className="charts-container">
          {currentPage === "gdp" && (
            <div>
              {gdpData.length > 0 ? (
                <GDPChart data={gdpData} schema={gdpSchema} />
              ) : (
                <p>GDP data is currently unavailable.</p>
              )}
            </div>
          )}
          {currentPage === "electricity" && (
            <div>
              {electricityAvailable &&
              electricityMetadata &&
              electricityWorkerRef.current ? (
                <ElectricityChart
                  worker={electricityWorkerRef.current}
                  initialMetadata={electricityMetadata}
                  schema={electricitySchema}
                />
              ) : (
                <p>
                  Electricity data is currently unavailable or failed to
                  initialize.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default Dashboard;
