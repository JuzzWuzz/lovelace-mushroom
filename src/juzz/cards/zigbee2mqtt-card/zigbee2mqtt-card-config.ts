import { assign, boolean, enums, object, optional, string } from "superstruct";
import { LovelaceCardConfig } from "../../../ha";
import { entitySharedConfigStruct, EntitySharedConfig } from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import { layoutStruct, Layout } from "../../../utils/layout";
import { ENTITY_TYPES, EntityType } from "../../utils/base-device-card";
import {
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN,
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_RELATED_ENTITIES,
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_POWER_STATUS,
    ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME,
} from "./const";

export type Zigbee2MQTTCardConfig = LovelaceCardConfig &
    EntitySharedConfig & {
        entity_type?: EntityType;
        icon_color?: string;
        layout?: Layout;
        fill_container?: boolean;
        use_device_name?: boolean;
        show_related_entities?: boolean;
        show_power_status?: boolean;
        show_last_seen?: boolean;
    };

export const Zigbee2MQTTCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    object({
        entity_type: optional(enums(ENTITY_TYPES)),
        icon_color: optional(string()),
        layout: optional(layoutStruct),
        fill_container: optional(boolean()),
        use_device_name: optional(boolean()),
        show_related_entities: optional(boolean()),
        show_power_status: optional(boolean()),
        show_last_seen: optional(boolean()),
    })
);

export const useDeviceName = (config: Zigbee2MQTTCardConfig): boolean => {
    return config.use_device_name ?? ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME;
};

export const showRelatedEntities = (config: Zigbee2MQTTCardConfig): boolean => {
    return config.show_related_entities ?? ZIGBEE2MQTT_CARD_DEFAULT_SHOW_RELATED_ENTITIES;
};

export const showPowerStatus = (config: Zigbee2MQTTCardConfig): boolean => {
    return config.show_power_status ?? ZIGBEE2MQTT_CARD_DEFAULT_SHOW_POWER_STATUS;
};

export const showLastSeen = (config: Zigbee2MQTTCardConfig): boolean => {
    return config.show_last_seen ?? ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN;
};
