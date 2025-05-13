import type { PlotData } from "plotly.js";

// Messages sent FROM the main thread TO the worker
export interface InitWorkerMessage {
  type: "INIT_AND_PARSE";
  parquetData: ArrayBuffer;
  wasmPath: string; // Path to parquet_wasm_bg.wasm
}

export interface AggregateMessage {
  type: "AGGREGATE";
  payload: AggregationRequest;
}

export type ToWorkerMessage = InitWorkerMessage | AggregateMessage; // Updated

// Messages sent FROM the worker TO the main thread
export interface ParseSuccessMessage {
  type: "PARSE_SUCCESS";
  availableCountries: string[];
  dateRange: { min: string; max: string };
  // We won't send all raw data back initially to avoid large data transfer
  // Instead, the worker will hold it. We can send a sample or count if needed.
  numberOfRecords: number;
}

export interface ParseErrorMessage {
  type: "PARSE_ERROR";
  error: string;
}

export interface AggregationResultMessage {
  type: "AGGREGATION_RESULT";
  payload: AggregatedPlotData;
}

export interface AggregationErrorMessage {
  type: "AGGREGATION_ERROR";
  error: string;
}

export type FromWorkerMessage =
  | ParseSuccessMessage
  | ParseErrorMessage
  | AggregationResultMessage
  | AggregationErrorMessage;

// Data structure for aggregation requests (will be used in Phase 2)
export interface AggregationRequest {
  aggregationLevel: "yearly" | "monthly" | "daily";
  selectedCountries: string[];
  // dateRange: { startDate: string | null; endDate: string | null }; // Add in Phase 3
}

// Data structure for aggregated results (will be used in Phase 2)
// Using PlotData from plotly.js for the traces
export type AggregatedPlotData = Partial<PlotData>[];
