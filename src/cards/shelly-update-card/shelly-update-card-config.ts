import { assign, boolean, object, optional } from "superstruct";
import { entitySharedConfigStruct, EntitySharedConfig } from "../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../shared/config/lovelace-card-config";
import { LovelaceCardConfig } from "../../ha";

export const SHELLY_UPDATE_CARD_DEFAULT_USE_DEVICE_NAME = true;
export const SHELLY_UPDATE_CARD_DEFAULT_CONTROLS_REQUIRE_ADMIN = true;

export type ShellyUpdateCardConfig = LovelaceCardConfig &
    EntitySharedConfig & {
        use_device_name?: boolean;
        controls_require_admin?: boolean;
    };

// Enforce strict types for internal use
export type ShellyUpdateCardConfigStrict = ShellyUpdateCardConfig & {
    use_device_name: boolean;
    controls_require_admin: boolean;
};

export const ShellyUpdateCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    object({
        use_device_name: optional(boolean()),
        controls_require_admin: optional(boolean()),
    })
);
