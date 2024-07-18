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
    UPDATE_DOMAINS,
    SHELLY_CARD_EDITOR_NAME,
    SHELLY_CARD_DEFAULT_USE_DEVICE_NAME,
} from "./const";
import {
    ShellyCardConfig as ShellyCardConfig,
    ShellyCardConfigStruct,
    useDeviceName,
} from "./shelly-card-config";

const SCHEMA: HaFormSchema[] = [
    { name: "entity", selector: { entity: { domain: UPDATE_DOMAINS } } },
    { name: "name", selector: { text: {} } },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "layout", selector: { mush_layout: {} } },
            { name: "fill_container", selector: { boolean: {} } },
        ],
    },
    { name: "use_device_name", selector: { boolean: {} } },
];

@customElement(SHELLY_CARD_EDITOR_NAME)
export class ShellyCardEditor extends MushroomBaseElement implements LovelaceCardEditor {
    @state() private _config?: ShellyCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: ShellyCardConfig): void {
        assert(config, ShellyCardConfigStruct);
        this._config = config;
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

        const data: ShellyCardConfig = { ...this._config };

        // Handle setting defaults
        data.use_device_name = useDeviceName(data);

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
        if (newConfig.use_device_name === SHELLY_CARD_DEFAULT_USE_DEVICE_NAME) {
            delete newConfig.use_device_name;
        }
        fireEvent(this, "config-changed", { config: newConfig });
    }
}
