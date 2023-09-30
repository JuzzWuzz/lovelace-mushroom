import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { assert } from "superstruct";
import { fireEvent, LovelaceCardEditor } from "../../ha";
import setupCustomlocalize from "../../localize";
import { MushroomBaseElement } from "../../utils/base-element";
import { GENERIC_LABELS } from "../../utils/form/generic-fields";
import { HaFormSchema } from "../../utils/form/ha-form";
import { loadHaComponents } from "../../utils/loader";
import { BAR_CARD_EDITOR_NAME } from "./const";
import {
    BAR_CARD_DEFAULT_SHOW_ICON,
    BAR_CARD_DEFAULT_SHOW_NAME,
    BAR_CARD_DEFAULT_SHOW_STATE,
    BarCardConfig,
    BarCardConfigStruct,
} from "./bar-card-config";

const SCHEMA: HaFormSchema[] = [
    { name: "entity", selector: { entity: { domain: "sensor" } } },
    { name: "name", selector: { text: {} } },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } },
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
            { name: "show_name", selector: { boolean: {} } },
            { name: "show_state", selector: { boolean: {} } },
            { name: "show_icon", selector: { boolean: {} } },
        ],
    },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "min", selector: { number: { mode: "box" } } },
            { name: "max", selector: { number: { mode: "box" } } },
        ],
    },
];

@customElement(BAR_CARD_EDITOR_NAME)
export class BarCardEditor extends MushroomBaseElement implements LovelaceCardEditor {
    @state() private _config?: BarCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: BarCardConfig): void {
        assert(config, BarCardConfigStruct);
        this._config = config;
    }

    private _computeLabel = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (GENERIC_LABELS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
        }

        if (schema.name === "min") {
            return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.minimum`);
        }
        if (schema.name === "max") {
            return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.maximum`);
        }

        return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };

    protected render() {
        if (!this.hass || !this._config) {
            return nothing;
        }

        const data: BarCardConfig = {
            ...this._config,
        };

        // Handle setting defaults
        data.show_name = data.show_name ?? BAR_CARD_DEFAULT_SHOW_NAME;
        data.show_state = data.show_state ?? BAR_CARD_DEFAULT_SHOW_STATE;
        data.show_icon = data.show_icon ?? BAR_CARD_DEFAULT_SHOW_ICON;

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
