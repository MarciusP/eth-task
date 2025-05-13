// Placeholder for data loading and parsing logic
import type { GDPDataPoint, GDPSchema } from "../types/gdp";
import type { GenerationSchema } from "../types/generation";
import Papa from "papaparse";
import type {
  FromWorkerMessage,
  ParseSuccessMessage,
} from "../workers/workerTypes";

export const loadGDPData = async (): Promise<GDPDataPoint[]> => {
  try {
    const response = await fetch("/data/gdp.csv");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();

    return new Promise<GDPDataPoint[]>((resolve, reject) => {
      Papa.parse<any>(csvText, {
        // Using any for raw row, will map to GDPDataPoint
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Automatically converts numbers and booleans
        complete: (results) => {
          if (results.errors.length) {
            console.error("PapaParse errors:", results.errors);
            reject(new Error("Error parsing GDP CSV data"));
            return;
          }
          // The schema defines year as integer and gdp as number.
          // PapaParse with dynamicTyping should handle this, but we can add explicit conversion if needed.
          const data = results.data
            .map((row) => ({
              year: parseInt(row.year, 10), // Ensure year is integer
              country_id: row.country_id as "AT" | "DE" | "CH",
              country_label: row.country_label as
                | "Austria"
                | "Germany"
                | "Switzerland",
              gdp: parseFloat(row.gdp), // Ensure GDP is float/number
            }))
            .filter(
              (row) =>
                row.year &&
                row.country_id &&
                row.gdp !== null &&
                row.gdp !== undefined
            );
          // Filter out any potentially incomplete rows after mapping, though skipEmptyLines helps
          resolve(data as GDPDataPoint[]);
        },
        error: (error: Error) => {
          console.error("Failed to parse GDP CSV:", error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Failed to load GDP CSV data:", error);
    return []; // Or reject promise, depending on desired error handling in App.tsx
  }
};

// Define a type for the resolved value of loadElectricityData
// It will contain the worker instance and initial metadata
export interface ElectricityDataWorkerResponse {
  worker: Worker;
  initialData: ParseSuccessMessage;
}

// Redefine loadElectricityData to use the Web Worker
export const loadElectricityData =
  async (): Promise<ElectricityDataWorkerResponse> => {
    try {
      const response = await fetch("/data/generation.parquet");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();

      // Create the worker
      // Note: Vite requires the `new URL(...)` syntax for worker instantiation
      const worker = new Worker(
        new URL("../workers/electricityWorker.ts", import.meta.url),
        { type: "module" }
      );

      // Return a Promise that resolves/rejects based on the worker's first message
      return new Promise((resolve, reject) => {
        worker.onmessage = (event: MessageEvent<FromWorkerMessage>) => {
          if (event.data.type === "PARSE_SUCCESS") {
            resolve({ worker: worker, initialData: event.data });
          } else if (event.data.type === "PARSE_ERROR") {
            console.error(
              "MainThread: Worker reported parsing error:",
              event.data.error
            );
            worker.terminate(); // Clean up the worker on error
            reject(new Error(event.data.error));
          }
          // In phase 2, we might handle other message types here or keep listening
          // For phase 1, we only care about the first success/error message for initialization
          // We might want to remove the listener after the first message if we only care about init result
          // worker.onmessage = null; // Example: Stop listening after first message
        };

        worker.onerror = (error) => {
          console.error("MainThread: Worker error:", error);
          worker.terminate(); // Clean up the worker
          reject(new Error(`Worker error: ${error.message}`));
        };

        // Send the data to the worker to start parsing
        // The path to the wasm file is relative to the public directory
        const wasmPath = "/parquet_wasm_bg.wasm";
        // Transfer the ArrayBuffer to avoid copying
        worker.postMessage(
          { type: "INIT_AND_PARSE", parquetData: arrayBuffer, wasmPath },
          [arrayBuffer]
        );
      });
    } catch (error) {
      console.error(
        "MainThread: Failed to fetch or initialize worker for Electricity Parquet data:",
        error
      );
      // Ensure the promise rejects if the fetch fails
      return Promise.reject(error);
    }
  };

export const loadGDPSchema = async (): Promise<GDPSchema | null> => {
  try {
    const response = await fetch("/schemas/gdp.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const schema: GDPSchema = await response.json();
    return schema;
  } catch (error) {
    console.error("Failed to load GDP schema:", error);
    return null;
  }
};

export const loadElectricitySchema =
  async (): Promise<GenerationSchema | null> => {
    try {
      const response = await fetch("/schemas/generation.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const schema: GenerationSchema = await response.json();
      return schema;
    } catch (error) {
      console.error("Failed to load Electricity schema:", error);
      return null;
    }
  };
