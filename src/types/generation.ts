export type Technology =
  | 'Coal'
  | 'Gas'
  | 'Hydro'
  | 'Other'
  | 'Solar'
  | 'Wind'
  | 'Nuclear'
  | 'Lignite';

export interface GenerationDataPoint {
  year: number; // This might be redundant if datetime is complete
  datetime: string; // ISO 8601 datetime string e.g. "2023-01-01T00:00:00Z" - needs confirmation from actual parquet data
  country_id: 'AT' | 'DE' | 'CH';
  country_label: 'Austria' | 'Germany' | 'Switzerland';
  technology: Technology;
  generation: number; // in MWh
}

export interface GenerationSchema {
  name: string;
  title: string;
  description: string;
  tags: string[];
  valueField: {
    field: 'generation';
    unit: 'MWh';
  };
  timeFields: Array<
    | { field: 'year'; frequency: 'yearly' }
    | { field: 'datetime'; frequency: 'hourly' }
  >;
  locationFields: Array<{
    field: 'country_id' | 'country_label';
    locationType: 'country';
  }>;
  fields: Array<{
    name: 'year' | 'country_id' | 'country_label' | 'technology' | 'generation' | 'datetime'; // Added datetime here
    type: 'integer' | 'string' | 'number'; // Datetime might be string or a more specific date type post-parsing
    title: string;
    description: string;
    constraints: {
      required: true;
      minimum?: number;
      maximum?: number;
      maxLength?: number;
      enum?: string[];
    };
  }>;
} 