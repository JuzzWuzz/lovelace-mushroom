type BaseButtonConfig = {
  type: string;
  icon?: string;
  label?: string;
};
export type EffectButtonConfig = BaseButtonConfig & {
  type: "effect";
  effect: string;
  brightness_pct?: number;
};

export type ToggleButtonConfig = BaseButtonConfig & {
  type: "toggle";
};

export type TurnOnButtonConfig = BaseButtonConfig & {
  type: "turn-on";
  brightness_pct?: number;
  kelvin?: number;
};

export type LovelaceButtonConfig =
  | EffectButtonConfig
  | ToggleButtonConfig
  | TurnOnButtonConfig;

export const BUTTON_LIST: LovelaceButtonConfig["type"][] = [
  "effect",
  "toggle",
  "turn-on",
];
