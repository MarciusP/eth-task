// Placeholder for data loading and parsing logic
import type { GDPDataPoint, GDPSchema } from "../types/gdp";
import type {
  GenerationDataPoint,
  GenerationSchema,
} from "../types/generation";
import Papa from "papaparse";

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
          console.log("GDP data loaded and parsed:", data);
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

export const loadElectricityData = async (): Promise<GenerationDataPoint[]> => {
  // TODO: Implement Electricity data loading from Parquet (task/data/generation.parquet)
  // TODO: Fetch and use schema from task/schemas/generation.json
  console.log("Loading Electricity data...");
  // parquet-wasm will be used here
  return [];
};

export const loadGDPSchema = async (): Promise<GDPSchema | null> => {
  try {
    const response = await fetch("/schemas/gdp.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const schema: GDPSchema = await response.json();
    console.log("GDP schema loaded:", schema);
    return schema;
  } catch (error) {
    console.error("Failed to load GDP schema:", error);
    return null;
  }
};

export const loadElectricitySchema =
  async (): Promise<GenerationSchema | null> => {
    // Placeholder - will be implemented later
    console.log("Loading Electricity schema... (placeholder)");
    return null;
  };
