export const DATA_TYPES = [
  "energy",
  "latency",
  "percentage",
  "power",
  "temperature",
] as const;
export type DataType = (typeof DATA_TYPES)[number];

export interface DataTypeConfig {
  floatPrecision: number;
  unit?: string;
  unitArray?: string[];
  unitSeparator: string;
  unitStep?: number;
}

export interface FormattedValue {
  value: string;
  unitSeparator: string;
  unitOfMeasurement: string;
  formatted(): string;
}
