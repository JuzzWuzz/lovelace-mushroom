import { assign, boolean, object, optional, string } from "superstruct";
import { entitySharedConfigStruct, EntitySharedConfig } from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import { LovelaceCardConfig } from "../../../ha";

export const SENSOR_CARD_DEFAULT_USE_DEVICE_NAME = true;
export const SENSOR_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES = true;
export const SENSOR_CARD_SHOW_POWER_STATUS = true;
export const SENSOR_CARD_DEFAULT_SHOW_LAST_SEEN = true;

export type SensorCardConfig = LovelaceCardConfig &
    EntitySharedConfig & {
        icon_color?: string;
        use_device_name?: boolean;
        show_other_device_entities?: boolean;
        show_power_status?: boolean;
        show_last_seen?: boolean;
    };

// Enforce strict types for internal use
export type SensorCardConfigStrict = SensorCardConfig & {
    use_device_name: boolean;
    show_other_device_entities: boolean;
    show_power_status: boolean;
    show_last_seen: boolean;
};

export const SensorCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    object({
        icon_color: optional(string()),
        use_device_name: optional(boolean()),
        show_other_device_entities: optional(boolean()),
        show_power_status: optional(boolean()),
        show_last_seen: optional(boolean()),
    })
);
