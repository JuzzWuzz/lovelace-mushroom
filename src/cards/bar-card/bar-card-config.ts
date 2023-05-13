import { array, assign, number, object, optional, string } from "superstruct";
import { LovelaceCardConfig } from "../../ha";
import { ActionsSharedConfig, actionsSharedConfigStruct } from "../../shared/config/actions-config";
import {
    AppearanceSharedConfig,
    appearanceSharedConfigStruct,
} from "../../shared/config/appearance-config";
import { EntitySharedConfig, entitySharedConfigStruct } from "../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../shared/config/lovelace-card-config";

export interface SegmentConfig {
    from: number;
    color: string;
}

export type BarCardConfig = LovelaceCardConfig &
    EntitySharedConfig &
    AppearanceSharedConfig &
    ActionsSharedConfig & {
        icon_color?: string;
        min?: Number;
        max?: Number;
        segments?: SegmentConfig[];
    };

const segmentStruct = object({
    from: number(),
    color: string(),
});

export const BarCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    assign(entitySharedConfigStruct, appearanceSharedConfigStruct, actionsSharedConfigStruct),
    object({
        icon_color: optional(string()),
        min: optional(number()),
        max: optional(number()),
        segments: optional(array(segmentStruct)),
    })
);
