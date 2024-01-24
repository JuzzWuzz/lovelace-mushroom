import { assign, boolean, object, optional } from "superstruct";
import { entitySharedConfigStruct, EntitySharedConfig } from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import { LovelaceCardConfig } from "../../../ha";

export type AirPurifierCardConfig = LovelaceCardConfig &
    EntitySharedConfig & {
        icon_animation?: boolean;
    };

export const airPurifierCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    object({
        icon_animation: optional(boolean()),
    })
);
