import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { assert } from "superstruct";
import { LovelaceCardEditor, fireEvent } from "../../../ha";
import setupCustomlocalize from "../../../localize";
import { MushroomBaseElement } from "../../../utils/base-element";
import { GENERIC_LABELS } from "../../../utils/form/generic-fields";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { loadHaComponents } from "../../../utils/loader";
import {
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN,
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_RELATED_ENTITIES,
    ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME,
    ZIGBEE2MQTT_CARD_DOMAINS,
    ZIGBEE2MQTT_CARD_EDITOR_NAME,
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_POWER_STATUS,
} from "./const";
import {
    showLastSeen,
    showPowerStatus,
    showRelatedEntities,
    useDeviceName,
    Zigbee2MQTTCardConfig,
    Zigbee2MQTTCardConfigStruct,
} from "./zigbee2mqtt-card-config";

const SCHEMA: HaFormSchema[] = [
    { name: "entity", selector: { entity: { domain: ZIGBEE2MQTT_CARD_DOMAINS } } },
    { name: "name", selector: { text: {} } },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "entity_type", selector: { mush_entity_type: {} } },
            { name: "icon_color", selector: { mush_color: {} } },
        ],
    },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "layout", selector: { mush_layout: {} } },
            { name: "fill_container", selector: { boolean: {} } },
        ],
    },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "use_device_name", selector: { boolean: {} } },
            { name: "show_related_entities", selector: { boolean: {} } },
            { name: "show_power_status", selector: { boolean: {} } },
            { name: "show_last_seen", selector: { boolean: {} } },
        ],
    },
];

@customElement(ZIGBEE2MQTT_CARD_EDITOR_NAME)
export class Zigbee2MQTTCardEditor extends MushroomBaseElement implements LovelaceCardEditor {
    @state() private _config?: Zigbee2MQTTCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: Zigbee2MQTTCardConfig): void {
        assert(config, Zigbee2MQTTCardConfigStruct);
        this._config = config;
    }

    private _computeLabel = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (GENERIC_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
        }
        if (schema.name === "entity_type") {
            return "Entity Type";
        }
        if (schema.name === "use_device_name") {
            return "Use Device Name?";
        }
        if (schema.name === "show_related_entities") {
            return "Show Other Device Entities?";
        }
        if (schema.name === "show_power_status") {
            return "Show Power Status?";
        }
        if (schema.name === "show_last_seen") {
            return "Show Last Seen?";
        }
        return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };

    protected render() {
        if (!this.hass || !this._config) {
            return nothing;
        }

        const data: Zigbee2MQTTCardConfig = { ...this._config };

        // Handle setting defaults
        data.use_device_name = useDeviceName(data);
        data.show_related_entities = showRelatedEntities(data);
        data.show_power_status = showPowerStatus(data);
        data.show_last_seen = showLastSeen(data);

        return html`
            <ha-form
                .hass=${this.hass}
                .data=${data}
                .schema=${SCHEMA}
                .computeLabel=${this._computeLabel}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
    }

    private _valueChanged(ev: CustomEvent): void {
        // Delete default values
        const newConfig = { ...ev.detail.value };
        if (newConfig.fill_container === false) {
            delete newConfig.fill_container;
        }
        if (newConfig.use_device_name === ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME) {
            delete newConfig.use_device_name;
        }
        if (newConfig.show_related_entities === ZIGBEE2MQTT_CARD_DEFAULT_SHOW_RELATED_ENTITIES) {
            delete newConfig.show_related_entities;
        }
        if (newConfig.show_power_status === ZIGBEE2MQTT_CARD_DEFAULT_SHOW_POWER_STATUS) {
            delete newConfig.show_power_status;
        }
        if (newConfig.show_last_seen === ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN) {
            delete newConfig.show_last_seen;
        }
        fireEvent(this, "config-changed", { config: newConfig });
    }
}
