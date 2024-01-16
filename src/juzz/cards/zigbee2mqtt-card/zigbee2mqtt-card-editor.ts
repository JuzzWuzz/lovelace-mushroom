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
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES,
    ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME,
    ZIGBEE2MQTT_CARD_DOMAINS,
    ZIGBEE2MQTT_CARD_EDITOR_NAME,
    ZIGBEE2MQTT_CARD_SHOW_POWER_STATUS,
} from "./const";
import { Zigbee2MQTTCardConfig, Zigbee2MQTTCardConfigStruct } from "./zigbee2mqtt-card-config";

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
            { name: "use_device_name", selector: { boolean: {} } },
            { name: "show_other_device_entities", selector: { boolean: {} } },
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

        // Handle setting boolean defaults
        if ((this._config.use_device_name ?? null) === null) {
            this._config.use_device_name = ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME;
        }
        if ((this._config.show_other_device_entities ?? null) === null) {
            this._config.show_other_device_entities =
                ZIGBEE2MQTT_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES;
        }
        if ((this._config.show_power_status ?? null) === null) {
            this._config.show_power_status = ZIGBEE2MQTT_CARD_SHOW_POWER_STATUS;
        }
        if ((this._config.show_last_seen ?? null) === null) {
            this._config.show_last_seen = ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN;
        }
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
        if (schema.name === "show_other_device_entities") {
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

        const data = { ...this._config } as any;

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
        fireEvent(this, "config-changed", { config: ev.detail.value });
    }
}
