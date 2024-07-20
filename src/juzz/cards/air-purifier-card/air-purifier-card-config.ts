import { assign, boolean, object, optional } from "superstruct";
import { entitySharedConfigStruct, EntitySharedConfig } from "../../../shared/config/entity-config";
import { lovelaceCardConfigStruct } from "../../../shared/config/lovelace-card-config";

import { LovelaceCardConfig } from "../../../ha";
import {
    SimpleAppearanceSharedConfig,
    simpleAppearanceSharedConfigStruct,
} from "../../shared/config/simple-layout-config";
import { AIR_PURIFIER_CARD_DEFAULT_SHOW_DEVICE_CONTROLS } from "./const";

export type AirPurifierCardConfig = LovelaceCardConfig &
    EntitySharedConfig &
    SimpleAppearanceSharedConfig & {
        icon_animation?: boolean;
        show_device_controls?: boolean;
    };

export const airPurifierCardConfigStruct = assign(
    lovelaceCardConfigStruct,
    entitySharedConfigStruct,
    simpleAppearanceSharedConfigStruct,
    object({
        icon_animation: optional(boolean()),
        show_device_controls: optional(boolean()),
    })
);

export const showDeviceControls = (config: AirPurifierCardConfig): boolean => {
    return config.show_device_controls ?? AIR_PURIFIER_CARD_DEFAULT_SHOW_DEVICE_CONTROLS;
};
