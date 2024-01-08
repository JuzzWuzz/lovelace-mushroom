import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { assert } from "superstruct";
import { LovelaceCardEditor, fireEvent } from "../../../ha";
import setupCustomlocalize from "../../../localize";
import { MushroomBaseElement } from "../../../utils/base-element";
import { GENERIC_LABELS } from "../../../utils/form/generic-fields";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { loadHaComponents } from "../../../utils/loader";
import { SENSOR_CARD_DOMAINS, SENSOR_CARD_EDITOR_NAME } from "./const";
import {
    SENSOR_CARD_DEFAULT_SHOW_LAST_SEEN,
    SENSOR_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES,
    SENSOR_CARD_DEFAULT_USE_DEVICE_NAME,
    SENSOR_CARD_SHOW_POWER_STATUS,
    SensorCardConfig,
    SensorCardConfigStruct,
} from "./sensor-card-config";

const SCHEMA: HaFormSchema[] = [
    { name: "entity", selector: { entity: { domain: SENSOR_CARD_DOMAINS } } },
    { name: "name", selector: { text: {} } },
    { name: "icon_color", selector: { mush_color: {} } },
    { name: "use_device_name", selector: { boolean: {} } },
    { name: "show_other_device_entities", selector: { boolean: {} } },
    { name: "show_power_status", selector: { boolean: {} } },
    { name: "show_last_seen", selector: { boolean: {} } },
];

@customElement(SENSOR_CARD_EDITOR_NAME)
export class SensorCardEditor extends MushroomBaseElement implements LovelaceCardEditor {
    @state() private _config?: SensorCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: SensorCardConfig): void {
        assert(config, SensorCardConfigStruct);
        this._config = config;

        // Handle setting boolean defaults
        if ((this._config.use_device_name ?? null) === null) {
            this._config.use_device_name = SENSOR_CARD_DEFAULT_USE_DEVICE_NAME;
        }
        if ((this._config.show_other_device_entities ?? null) === null) {
            this._config.show_other_device_entities =
                SENSOR_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES;
        }
        if ((this._config.show_power_status ?? null) === null) {
            this._config.show_power_status = SENSOR_CARD_SHOW_POWER_STATUS;
        }
        if ((this._config.show_last_seen ?? null) === null) {
            this._config.show_last_seen = SENSOR_CARD_DEFAULT_SHOW_LAST_SEEN;
        }
    }

    private _computeLabel = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (GENERIC_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
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
