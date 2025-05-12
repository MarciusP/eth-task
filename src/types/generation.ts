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
  year: number;
  datetime: string;
  country_id: 'AT' | 'DE' | 'CH';
  country_label: 'Austria' | 'Germany' | 'Switzerland';
  technology: Technology;
  generation: number;
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
    name: 'year' | 'country_id' | 'country_label' | 'technology' | 'generation' | 'datetime';
    type: 'integer' | 'string' | 'number';
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