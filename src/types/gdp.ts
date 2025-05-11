export interface GDPDataPoint {
  year: number;
  country_id: 'AT' | 'DE' | 'CH';
  country_label: 'Austria' | 'Germany' | 'Switzerland';
  gdp: number; // in Euros
}

export interface GDPSchema {
  name: string;
  title: string;
  description: string;
  tags: string[];
  valueField: {
    field: 'gdp';
    unit: 'Euro';
  };
  timeFields: Array<{
    field: 'year';
    frequency: 'yearly';
  }>;
  locationFields: Array<{
    field: 'country_id' | 'country_label';
    locationType: 'country';
  }>;
  fields: Array<{
    name: 'year' | 'country_id' | 'country_label' | 'gdp';
    type: 'integer' | 'string' | 'number';
    title: string;
    description:string;
    constraints: {
      required: true;
      minimum?: number;
      maximum?: number;
      maxLength?: number;
      enum?: string[];
    };
  }>;
} 