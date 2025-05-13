/// <reference lib="webworker" />

import initParquetWasmModule, * as parquetWasm from "parquet-wasm";
import * as arrow from "apache-arrow";
import type { GenerationDataPoint } from "../types/generation"; // Assuming path works at runtime
import type {
  ToWorkerMessage,
  FromWorkerMessage,
  ParseSuccessMessage,
  ParseErrorMessage,
  AggregationRequest,
  AggregatedPlotData,
} from "./workerTypes";

// Global state within the worker
let rawData: GenerationDataPoint[] = [];
let isInitialized = false;

// Function to parse the data and prepare initial response
async function handleInitialization(
  parquetData: ArrayBuffer,
  wasmPath: string
): Promise<ParseSuccessMessage | ParseErrorMessage> {
  try {
    await initParquetWasmModule(wasmPath);
    const wasmArrowTable = parquetWasm.readParquet(new Uint8Array(parquetData));
    const ipcStream = wasmArrowTable.intoIPCStream();
    const jsArrowTable = arrow.tableFromIPC(ipcStream);
    const jsonData: any[] = jsArrowTable.toArray();

    rawData = jsonData.map((row: any) => ({
      year: Number(row.year),
      datetime: String(row.datetime),
      country_id: row.country_id as "AT" | "DE" | "CH",
      country_label: row.country_label as "Austria" | "Germany" | "Switzerland",
      technology: row.technology,
      generation: Number(row.generation),
    }));

    if (rawData.length === 0) {
      return { type: "PARSE_ERROR", error: "No records found after parsing." };
    }

    const availableCountries = Array.from(
      new Set(rawData.map((d) => d.country_id))
    ).sort();
    const dates = rawData
      .map(
        (d) =>
          new Date(
            Number.isNaN(Number(d.datetime)) ? d.datetime : Number(d.datetime)
          )
      )
      .filter((d) => !isNaN(d.getTime()));
    const minDate =
      dates.length > 0
        ? dates.reduce((min, p) => (p < min ? p : min), dates[0])
        : null;
    const maxDate =
      dates.length > 0
        ? dates.reduce((max, p) => (p > max ? p : max), dates[0])
        : null;

    isInitialized = true;

    return {
      type: "PARSE_SUCCESS",
      availableCountries: availableCountries,
      dateRange: {
        min: minDate?.toISOString() || "N/A",
        max: maxDate?.toISOString() || "N/A",
      },
      numberOfRecords: rawData.length,
    };
  } catch (error: any) {
    console.error("Worker: Error during initialization/parsing:", error);
    isInitialized = false;
    rawData = [];
    return {
      type: "PARSE_ERROR",
      error: error.message || "Unknown parsing error",
    };
  }
}

// Function to perform aggregation
function performAggregation(request: AggregationRequest): AggregatedPlotData {
  const { aggregationLevel, selectedCountries } = request;

  if (!rawData || rawData.length === 0) {
    return [];
  }

  const filteredData = rawData.filter((d) =>
    selectedCountries.includes(d.country_id)
  );

  if (filteredData.length === 0) {
    return [];
  }

  const aggregatedData: {
    [period: string]: { [country: string]: { [technology: string]: number } };
  } = {};
  const allTechnologies = new Set<string>();

  filteredData.forEach((d) => {
    let dateObj: Date;
    try {
      const numDt = Number(d.datetime);
      dateObj = !isNaN(numDt) ? new Date(numDt) : new Date(d.datetime);
      if (isNaN(dateObj.getTime())) return;
    } catch (e) {
      return;
    }

    let periodKey = "";
    if (aggregationLevel === "monthly") {
      const year = dateObj.getUTCFullYear();
      const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
      periodKey = `${year}-${month}`;
    } else if (aggregationLevel === "daily") {
      periodKey = dateObj.toISOString().split("T")[0];
    } else {
      periodKey = dateObj.getUTCFullYear().toString();
    }

    if (!aggregatedData[periodKey]) aggregatedData[periodKey] = {};
    if (!aggregatedData[periodKey][d.country_id])
      aggregatedData[periodKey][d.country_id] = {};
    if (!aggregatedData[periodKey][d.country_id][d.technology]) {
      aggregatedData[periodKey][d.country_id][d.technology] = 0;
    }

    aggregatedData[periodKey][d.country_id][d.technology] += d.generation;
    allTechnologies.add(d.technology);
  });

  const periods = Object.keys(aggregatedData).sort();
  const countriesToProcess = selectedCountries.sort();
  const technologies = Array.from(allTechnologies).sort();

  const traces: AggregatedPlotData = [];
  for (const country of countriesToProcess) {
    for (const tech of technologies) {
      const yValues = periods.map(
        (period) => aggregatedData[period]?.[country]?.[tech] || 0
      );
      if (yValues.some((val) => val > 0)) {
        traces.push({
          x: periods,
          y: yValues,
          name: `${country} - ${tech}`,
          type: "bar" as const,
        });
      }
    }
  }
  return traces;
}

// Main message handler for the worker
self.onmessage = async (event: MessageEvent<ToWorkerMessage>) => {
  const message = event.data;
  const messageType = message.type; // Store type here
  // console.log("Worker: Received message", messageType);

  let response: FromWorkerMessage | null = null;

  try {
    switch (
      message.type // Use message.type inside switch
    ) {
      case "INIT_AND_PARSE":
        if (isInitialized) {
          response = {
            type: "PARSE_ERROR",
            error: "Worker already initialized",
          };
        } else {
          response = await handleInitialization(
            message.parquetData,
            message.wasmPath
          );
        }
        break;

      case "AGGREGATE":
        if (!isInitialized || !rawData) {
          console.error(
            "Worker: Cannot aggregate before successful initialization."
          );
          response = {
            type: "AGGREGATION_ERROR",
            error: "Worker not initialized or no data.",
          };
        } else {
          const plotData = performAggregation(message.payload);
          response = { type: "AGGREGATION_RESULT", payload: plotData };
        }
        break;

      default:
        console.warn(`Worker: Received unknown message type: ${messageType}`);
    }
  } catch (error: any) {
    console.error(
      "Worker: Unhandled error processing message:",
      messageType,
      error
    );
    // Use stored messageType here
    response = {
      type: messageType === "AGGREGATE" ? "AGGREGATION_ERROR" : "PARSE_ERROR",
      error: `Unhandled worker error during ${messageType}: ${
        error.message || "Unknown error"
      }`,
    };
  }

  if (response) {
    self.postMessage(response);
  }
};

console.log("Worker: Script loaded and ready for messages.");
