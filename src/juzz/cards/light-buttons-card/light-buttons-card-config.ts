import {
  array,
  assign,
  boolean,
  dynamic,
  literal,
  number,
  object,
  optional,
  string,
} from "superstruct";
import { LovelaceCardConfig } from "../../../ha";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import {
  SimpleAppearanceSharedConfig,
  simpleAppearanceSharedConfigStruct,
} from "../../shared/config/simple-layout-config";
import { LovelaceButtonConfig } from "./buttons/types";
import { LIGHT_BUTTONS_DEFAULT_SHOW_LABELS } from "./const";

const baseButtonConfigStruct = object({
  type: string(),
  icon: optional(string()),
  label: optional(string()),
});

export const effectButtonConfigStruct = assign(
  baseButtonConfigStruct,
  object({
    type: literal("effect"),
    effect: string(),
    brightness_pct: optional(number()),
  })
);

export const toggleButtonConfigStruct = assign(
  baseButtonConfigStruct,
  object({
    type: literal("toggle"),
  })
);

export const turnOnButtonConfigStruct = assign(
  baseButtonConfigStruct,
  object({
    type: literal("turn-on"),
    brightness_pct: optional(number()),
    kelvin: optional(number()),
  })
);

const buttonsConfigStruct = dynamic<any>((value) => {
  if (value && typeof value === "object" && "type" in value) {
    switch ((value as LovelaceButtonConfig).type!) {
      case "effect":
        return effectButtonConfigStruct;
      case "toggle":
        return toggleButtonConfigStruct;
      case "turn-on":
        return turnOnButtonConfigStruct;
    }
  }
  return object();
});

export const lightButtonsCardConfigStruct = assign(
  lovelaceCardConfigStruct,
  object({
    entity: optional(string()),
    alignment: optional(string()),
    show_labels: optional(boolean()),
    buttons: array(buttonsConfigStruct),
  })
);

export type LightButtonsCardConfig = LovelaceCardConfig & {
  entity?: string;
  alignment?: string;
  show_labels?: boolean;
  buttons: LovelaceButtonConfig[];
};

export const configShowLabels = (config: LightButtonsCardConfig): boolean => {
  return config.show_labels ?? LIGHT_BUTTONS_DEFAULT_SHOW_LABELS;
};
