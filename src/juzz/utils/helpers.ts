import { NO_VALUE } from "./const";
import { DataType, DataTypeConfig, FormattedValue } from "./types";

export function getDataTypeForDeviceClass(
  deviceClass?: string
): DataType | undefined {
  switch (deviceClass) {
    case "energy":
    case "power":
    case "temperature": {
      return deviceClass;
    }
    case "battery":
    case "humidity": {
      return "percentage";
    }
    default: {
      return undefined;
    }
  }
}

export function getDataTypeConfig(dataType: DataType): DataTypeConfig {
  switch (dataType) {
    case "energy": {
      return {
        floatPrecision: 2,
        unitArray: ["Wh", "kWh", "MWh", "GWh"],
        unitSeparator: " ",
        unitStep: 1000,
      };
    }
    case "latency": {
      return {
        floatPrecision: 0,
        unit: "ms",
        unitSeparator: "",
      };
    }
    case "percentage": {
      return {
        floatPrecision: 0,
        unit: "%",
        unitSeparator: "",
      };
    }
    case "power": {
      return {
        floatPrecision: 2,
        unitArray: ["W", "kW", "MW", "GW"],
        unitSeparator: " ",
        unitStep: 1000,
      };
    }
    case "temperature": {
      return {
        floatPrecision: 1,
        unit: "°C",
        unitSeparator: "",
      };
    }
  }
}

export function formatValueAndUom(
  value: string | number | null | undefined,
  dataType: DataType,
  clampNegative: boolean
): FormattedValue {
  const dataTypeConfig = getDataTypeConfig(dataType);
  let lValue: string | number | null | undefined = value;
  let lPrecision: number = dataTypeConfig.floatPrecision;
  if (lValue === undefined || lValue === null) {
    lValue = null;
  } else {
    if (typeof lValue === "string") {
      lValue = parseFloat(lValue);

      if (Number.isNaN(lValue)) {
        lValue = value as string;
      }
    }
  }
  let uom: string | undefined = undefined;
  if (typeof lValue === "number") {
    if (clampNegative && lValue < 0) {
      lValue = 0;
    }
    if (dataTypeConfig.unitStep && dataTypeConfig.unitArray) {
      let i = 0;
      if (lValue !== 0) {
        i = Math.min(
          Math.max(
            Math.floor(
              Math.log(Math.abs(lValue)) / Math.log(dataTypeConfig.unitStep)
            ),
            0
          ),
          dataTypeConfig.unitArray.length - 1
        );
        lValue = lValue / Math.pow(dataTypeConfig.unitStep, i);
      }
      uom = dataTypeConfig.unitArray[i];
      if (i === 0) {
        lPrecision = 0;
      }
    }
    lValue = lValue.toFixed(lPrecision);
    // Fix for `-0`
    lValue = lValue.replace(/^-([.0]*)$/, "$1");
  }

  return {
    value: lValue ?? NO_VALUE,
    unitSeparator: dataTypeConfig?.unitSeparator,
    unitOfMeasurement: uom ?? dataTypeConfig?.unit ?? "",
    formatted() {
      return [this.value, this.unitOfMeasurement]
        .filter((s) => (s ?? "").trim().length > 0)
        .join(this.unitSeparator);
    },
  };
}
