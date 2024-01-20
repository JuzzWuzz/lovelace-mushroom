import { assign, boolean, object, optional } from "superstruct";
import { entitySharedConfigStruct, EntitySharedConfig } from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";
import { LovelaceCardConfig } from "../../../ha";

export type ShellyCardConfig = LovelaceCardConfig &
    EntitySharedConfig & {
        use_device_name?: boolean;
    };

// Enforce strict types for internal use
export type ShellyCardConfigStrict = ShellyCardConfig & {
    use_device_name: boolean;
};

export const ShellyCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    object({
        use_device_name: optional(boolean()),
    })
);
