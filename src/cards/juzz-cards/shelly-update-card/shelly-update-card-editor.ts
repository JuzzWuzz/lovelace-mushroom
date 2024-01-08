import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { assert } from "superstruct";
import { LovelaceCardEditor, fireEvent } from "../../../ha";
import setupCustomlocalize from "../../../localize";
import { MushroomBaseElement } from "../../../utils/base-element";
import { GENERIC_LABELS } from "../../../utils/form/generic-fields";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { loadHaComponents } from "../../../utils/loader";
import { UPDATE_DOMAINS, SHELLY_UPDATE_CARD_EDITOR_NAME } from "./const";
import {
    SHELLY_UPDATE_CARD_DEFAULT_USE_DEVICE_NAME,
    ShellyUpdateCardConfig,
    ShellyUpdateCardConfigStruct,
} from "./shelly-update-card-config";

const SCHEMA: HaFormSchema[] = [
    { name: "entity", selector: { entity: { domain: UPDATE_DOMAINS } } },
    { name: "name", selector: { text: {} } },
    { name: "use_device_name", selector: { boolean: {} } },
];

@customElement(SHELLY_UPDATE_CARD_EDITOR_NAME)
export class ShellyUpdateCardEditor extends MushroomBaseElement implements LovelaceCardEditor {
    @state() private _config?: ShellyUpdateCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: ShellyUpdateCardConfig): void {
        assert(config, ShellyUpdateCardConfigStruct);
        this._config = config;

        // Handle setting boolean defaults
        if ((this._config.use_device_name ?? null) === null) {
            this._config.use_device_name = SHELLY_UPDATE_CARD_DEFAULT_USE_DEVICE_NAME;
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
