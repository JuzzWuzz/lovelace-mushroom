import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { assert } from "superstruct";
import { LovelaceCardEditor, fireEvent } from "../../../ha";
import setupCustomlocalize from "../../../localize";
import { MushroomBaseElement } from "../../../utils/base-element";
import { GENERIC_LABELS } from "../../../utils/form/generic-fields";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { loadHaComponents } from "../../../utils/loader";
import { BASE_DEVICE_FORM_SCHEMA } from "../../shared/config/base-device-config";
import { SIMPLE_APPEARANCE_FORM_SCHEMA } from "../../shared/config/simple-layout-config";
import {
    AIR_PURIFIER_CARD_DEFAULT_SHOW_DEVICE_CONTROLS,
    AIR_PURIFIER_CARD_EDITOR_NAME,
    FAN_ENTITY_DOMAINS,
} from "./const";
import {
    AirPurifierCardConfig,
    airPurifierCardConfigStruct,
    showDeviceControls,
} from "./air-purifier-card-config";

const SCHEMA: HaFormSchema[] = [
    { name: "entity", selector: { entity: { domain: FAN_ENTITY_DOMAINS } } },
    { name: "name", selector: { text: {} } },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } },
            { name: "icon_animation", selector: { boolean: {} } },
        ],
    },
    ...SIMPLE_APPEARANCE_FORM_SCHEMA,
    { name: "show_device_controls", selector: { boolean: {} } },
];

@customElement(AIR_PURIFIER_CARD_EDITOR_NAME)
export class AirPurifierCardEditor extends MushroomBaseElement implements LovelaceCardEditor {
    @state() private _config?: AirPurifierCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: AirPurifierCardConfig): void {
        assert(config, airPurifierCardConfigStruct);
        this._config = config;
    }

    private _computeLabel = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (GENERIC_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
        }
        if (schema.name === "show_device_controls") {
            return "Show Device Controls?";
        }
        return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };

    protected render() {
        if (!this.hass || !this._config) {
            return nothing;
        }

        const data: AirPurifierCardConfig = { ...this._config };

        // Handle setting defaults
        data.show_device_controls = showDeviceControls(data);

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
        if (newConfig.show_device_controls === AIR_PURIFIER_CARD_DEFAULT_SHOW_DEVICE_CONTROLS) {
            delete newConfig.show_device_controls;
        }
        fireEvent(this, "config-changed", { config: newConfig });
    }
}
