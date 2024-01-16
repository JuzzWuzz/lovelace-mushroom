import { assign, boolean, enums, object, optional, string } from "superstruct";
import { entitySharedConfigStruct, EntitySharedConfig } from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import { LovelaceCardConfig } from "../../../ha";
import { ENTITY_TYPES, EntityType } from "../../utils/base-device-card";

export type Zigbee2MQTTCardConfig = LovelaceCardConfig &
    EntitySharedConfig & {
        entity_type?: EntityType;
        icon_color?: string;
        use_device_name?: boolean;
        show_other_device_entities?: boolean;
        show_power_status?: boolean;
        show_last_seen?: boolean;
    };

// Enforce strict types for internal use
export type Zigbee2MQTTCardConfigStrict = Zigbee2MQTTCardConfig & {
    use_device_name: boolean;
    show_other_device_entities: boolean;
    show_power_status: boolean;
    show_last_seen: boolean;
};

export const Zigbee2MQTTCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    object({
        entity_type: optional(enums(ENTITY_TYPES)),
        icon_color: optional(string()),
        use_device_name: optional(boolean()),
        show_other_device_entities: optional(boolean()),
        show_power_status: optional(boolean()),
        show_last_seen: optional(boolean()),
    })
);
