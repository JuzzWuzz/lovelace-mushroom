import { assign } from "superstruct";
import { LovelaceCardConfig } from "../../../ha";
import {
  entitySharedConfigStruct,
  EntitySharedConfig,
} from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import {
  baseDeviceSharedConfigStruct,
  BaseDeviceSharedConfig,
} from "../../shared/config/base-device-config";
import {
  SimpleAppearanceSharedConfig,
  simpleAppearanceSharedConfigStruct,
} from "../../shared/config/simple-layout-config";
import {
  SHELLY_CARD_DEFAULT_SHOW_DEVICE_CONTROLS,
  SHELLY_CARD_DEFAULT_USE_DEVICE_NAME,
} from "./const";

export type ShellyCardConfig = LovelaceCardConfig &
  EntitySharedConfig &
  SimpleAppearanceSharedConfig &
  BaseDeviceSharedConfig;

export const ShellyCardConfigStruct = assign(
  lovelaceCardConfigStruct,
  entitySharedConfigStruct,
  simpleAppearanceSharedConfigStruct,
  baseDeviceSharedConfigStruct
);

export const useDeviceName = (config: ShellyCardConfig): boolean => {
  return config.use_device_name ?? SHELLY_CARD_DEFAULT_USE_DEVICE_NAME;
};

export const showDeviceControls = (config: ShellyCardConfig): boolean => {
  return (
    config.show_device_controls ?? SHELLY_CARD_DEFAULT_SHOW_DEVICE_CONTROLS
  );
};
