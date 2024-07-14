import { assign, boolean, object, optional } from "superstruct";
import { entitySharedConfigStruct, EntitySharedConfig } from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import { Layout, layoutStruct } from "../../../utils/layout";
import { LovelaceCardConfig } from "../../../ha";
import { SHELLY_CARD_DEFAULT_USE_DEVICE_NAME } from "./const";

export type ShellyCardConfig = LovelaceCardConfig &
    EntitySharedConfig & {
        layout?: Layout;
        use_device_name?: boolean;
    };

export const ShellyCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    object({
        layout: optional(layoutStruct),
        use_device_name: optional(boolean()),
    })
);

export const useDeviceName = (config: ShellyCardConfig): boolean => {
    return config.use_device_name ?? SHELLY_CARD_DEFAULT_USE_DEVICE_NAME;
};
