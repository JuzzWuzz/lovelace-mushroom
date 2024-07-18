import { array, assign, boolean, number, object, optional, string } from "superstruct";
import { LovelaceCardConfig } from "../../../ha";
import { EntitySharedConfig, entitySharedConfigStruct } from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import {
    SimpleAppearanceSharedConfig,
    simpleAppearanceSharedConfigStruct,
} from "../../shared/config/simple-layout-config";
import {
    BAR_CARD_DEFAULT_MAX,
    BAR_CARD_DEFAULT_MIN,
    BAR_CARD_DEFAULT_SHOW_ICON,
    BAR_CARD_DEFAULT_SHOW_NAME,
    BAR_CARD_DEFAULT_SHOW_STATE,
} from "./const";

export interface SegmentConfig {
    from: number;
    color: string;
}

export type BarCardConfig = LovelaceCardConfig &
    EntitySharedConfig &
    SimpleAppearanceSharedConfig & {
        icon_color?: string;
        show_icon?: boolean;
        show_name?: boolean;
        show_state?: boolean;
        min: number;
        max: number;
        segments?: SegmentConfig[];
    };

const segmentStruct = object({
    from: number(),
    color: string(),
});

export const BarCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    simpleAppearanceSharedConfigStruct,
    object({
        icon_color: optional(string()),
        show_icon: optional(boolean()),
        show_name: optional(boolean()),
        show_state: optional(boolean()),
        min: optional(number()),
        max: optional(number()),
        segments: optional(array(segmentStruct)),
    })
);

export const showIcon = (config: BarCardConfig): boolean => {
    return config.show_icon ?? BAR_CARD_DEFAULT_SHOW_ICON;
};

export const showName = (config: BarCardConfig): boolean => {
    return config.show_name ?? BAR_CARD_DEFAULT_SHOW_NAME;
};

export const showState = (config: BarCardConfig): boolean => {
    return config.show_state ?? BAR_CARD_DEFAULT_SHOW_STATE;
};

export const getMin = (config: BarCardConfig): number => {
    return config.min ?? BAR_CARD_DEFAULT_MIN;
};

export const getMax = (config: BarCardConfig): number => {
    return config.max ?? BAR_CARD_DEFAULT_MAX;
};
