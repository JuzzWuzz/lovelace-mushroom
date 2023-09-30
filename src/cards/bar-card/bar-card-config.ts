import { array, assign, boolean, number, object, optional, string } from "superstruct";
import { LovelaceCardConfig } from "../../ha";
import { EntitySharedConfig, entitySharedConfigStruct } from "../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../shared/config/lovelace-card-config";
import { Layout, layoutStruct } from "../../utils/layout";

export interface SegmentConfig {
    from: number;
    color: string;
}

export const BAR_CARD_DEFAULT_SHOW_NAME = true;
export const BAR_CARD_DEFAULT_SHOW_STATE = true;
export const BAR_CARD_DEFAULT_SHOW_ICON = true;
export const BAR_CARD_DEFAULT_MIN = 0;
export const BAR_CARD_DEFAULT_MAX = 100;

export type BarCardConfig = LovelaceCardConfig &
    EntitySharedConfig & {
        icon_color?: string;
        layout?: Layout;
        fill_container?: boolean;
        show_name?: boolean;
        show_state?: boolean;
        show_icon?: boolean;
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
    object({
        icon_color: optional(string()),
        layout: optional(layoutStruct),
        fill_container: optional(boolean()),
        show_name: optional(boolean()),
        show_state: optional(boolean()),
        show_icon: optional(boolean()),
        min: number(),
        max: number(),
        segments: optional(array(segmentStruct)),
    })
);
