import { assign, boolean, enums, object, optional, string } from "superstruct";
import { LovelaceCardConfig } from "../../../ha";
import {
  EntitySharedConfig,
  entitySharedConfigStruct,
} from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import {
  SimpleAppearanceSharedConfig,
  simpleAppearanceSharedConfigStruct,
} from "../../shared/config/simple-layout-config";
import { DATA_TYPES, DataType } from "../../utils/types";
import {
  FORMATTED_SENSOR_CARD_DEFAULT_SHOW_ICON,
  FORMATTED_SENSOR_CARD_DEFAULT_SHOW_NAME,
  FORMATTED_SENSOR_CARD_DEFAULT_SHOW_STATE,
} from "./const";

export type FormattedSensorCardConfig = LovelaceCardConfig &
  EntitySharedConfig &
  SimpleAppearanceSharedConfig & {
    data_type?: DataType;
    state_color?: string;
    icon_color?: string;
    show_icon?: boolean;
    show_name?: boolean;
    show_state?: boolean;
  };

export const FormattedSensorCardConfigStruct = assign(
  lovelaceCardConfigStruct,
  entitySharedConfigStruct,
  simpleAppearanceSharedConfigStruct,
  object({
    data_type: optional(enums(DATA_TYPES)),
    state_color: optional(string()),
    icon_color: optional(string()),
    show_icon: optional(boolean()),
    show_name: optional(boolean()),
    show_state: optional(boolean()),
  })
);

export const showIcon = (config: FormattedSensorCardConfig): boolean => {
  return config.show_icon ?? FORMATTED_SENSOR_CARD_DEFAULT_SHOW_ICON;
};

export const showName = (config: FormattedSensorCardConfig): boolean => {
  return config.show_name ?? FORMATTED_SENSOR_CARD_DEFAULT_SHOW_NAME;
};

export const showState = (config: FormattedSensorCardConfig): boolean => {
  return config.show_state ?? FORMATTED_SENSOR_CARD_DEFAULT_SHOW_STATE;
};
