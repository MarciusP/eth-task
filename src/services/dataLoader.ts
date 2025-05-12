// Placeholder for data loading and parsing logic
import type { GDPDataPoint, GDPSchema } from "../types/gdp";
import type {
  GenerationDataPoint,
  GenerationSchema,
} from "../types/generation";
import Papa from "papaparse";
import initParquetWasmModule, * as parquetWasm from "parquet-wasm";
import * as arrow from "apache-arrow";

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
  let wasmArrowTable: any; // Declare here for access in catch block
  try {
    console.log("Attempting to load Electricity data from /data/generation.parquet...");

    await initParquetWasmModule('/parquet_wasm_bg.wasm'); 
    console.log("parquet-wasm initialized.");

    const response = await fetch("/data/generation.parquet");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const parquetData = new Uint8Array(arrayBuffer);

    wasmArrowTable = parquetWasm.readParquet(parquetData); // Assign here
    console.log("Wasm Arrow Table loaded from Parquet:", wasmArrowTable);

    // Convert Wasm Arrow Table to Arrow IPC Stream
    const ipcStream = wasmArrowTable.intoIPCStream();
    console.log("IPC Stream created from Wasm Table");

    // Read IPC Stream into a JavaScript Arrow Table
    const jsArrowTable = arrow.tableFromIPC(ipcStream);
    console.log("JavaScript Arrow Table created from IPC Stream:", jsArrowTable);

    // Convert JavaScript Arrow Table to an array of plain JavaScript objects
    // The .toArray() method on an Arrow JS Table typically returns an array of row objects.
    const jsonData: any[] = jsArrowTable.toArray();
    console.log(`Converted JS Arrow Table to JSON array. Number of rows: ${jsonData.length}`);

    const typedData: GenerationDataPoint[] = jsonData.map((row: any) => ({
      year: Number(row.year),
      datetime: String(row.datetime),
      country_id: row.country_id as "AT" | "DE" | "CH",
      country_label: row.country_label as "Austria" | "Germany" | "Switzerland",
      technology: row.technology,
      generation: Number(row.generation),
    }));

    console.log(
      `Electricity data processed. Total rows from JS Arrow Table: ${jsArrowTable.numRows}, First 5 typed records:`, 
      typedData.slice(0, 5)
    );
    return typedData;

  } catch (error) {
    console.error("Failed to load or parse Electricity Parquet data:", error);
    if (wasmArrowTable) { // Check if it was assigned
      console.error("Wasm Arrow Table object at time of error:", wasmArrowTable);
    }
    return [];
  }
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
    try {
      const response = await fetch("/schemas/generation.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const schema: GenerationSchema = await response.json();
      console.log("Electricity schema loaded:", schema);
      return schema;
    } catch (error) {
      console.error("Failed to load Electricity schema:", error);
      return null;
    }
  };
