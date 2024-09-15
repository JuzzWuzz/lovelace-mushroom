import { assert } from "superstruct";
import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { SIMPLE_APPEARANCE_FORM_SCHEMA } from "../../shared/config/simple-layout-config";
import { LovelaceCardEditor, fireEvent } from "../../../ha";
import setupCustomlocalize from "../../../localize";
import { MushroomBaseElement } from "../../../utils/base-element";
import { GENERIC_LABELS } from "../../../utils/form/generic-fields";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { loadHaComponents } from "../../../utils/loader";
import {
  LIGHT_ENTITY_DOMAINS,
  LIGHT_BUTTONS_CARD_EDITOR_NAME,
  LIGHT_BUTTONS_DEFAULT_SHOW_LABELS,
} from "./const";
import {
  configShowLabels,
  LightButtonsCardConfig,
  lightButtonsCardConfigStruct,
} from "./light-buttons-card-config";

const SCHEMA: HaFormSchema[] = [
  { name: "entity", selector: { entity: { domain: LIGHT_ENTITY_DOMAINS } } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "alignment", selector: { mush_alignment: {} } },
      { name: "show_labels", selector: { boolean: {} } },
    ],
  },
];

@customElement(LIGHT_BUTTONS_CARD_EDITOR_NAME)
export class LightButtonsCardEditor
  extends MushroomBaseElement
  implements LovelaceCardEditor
{
  @state() private _config?: LightButtonsCardConfig;

  // @state()
  // private _subElementEditorConfig?: SubElementEditorConfig<BaseSubElementConfig>;

  connectedCallback() {
    super.connectedCallback();
    void loadHaComponents();
  }

  public setConfig(config: LightButtonsCardConfig): void {
    assert(config, lightButtonsCardConfigStruct);
    this._config = config;
  }

  private _computeLabel = (schema: HaFormSchema) => {
    const customLocalize = setupCustomlocalize(this.hass!);

    if (GENERIC_LABELS.includes(schema.name)) {
      return customLocalize(`editor.card.generic.${schema.name}`);
    }
    if (schema.name === "alignment") {
      return customLocalize("editor.card.chips.alignment");
    }
    if (schema.name === "show_labels") {
      return "Show Labels?";
    }
    return this.hass!.localize(
      `ui.panel.lovelace.editor.card.generic.${schema.name}`
    );
  };

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    // if (this._subElementEditorConfig) {
    //   return html`
    //     <mushroom-sub-element-editor-ex
    //       .hass=${this.hass}
    //       .config=${this._subElementEditorConfig}
    //       @go-back=${this._goBack}
    //       @config-changed=${this._handleSubElementChanged}
    //     >
    //     </mushroom-sub-element-editor-ex>
    //   `;
    // }

    const data: LightButtonsCardConfig = { ...this._config };

    // Handle setting defaults
    data.show_labels = configShowLabels(data);

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
    let newConfig = { ...ev.detail.value };
    if (newConfig.show_labels === LIGHT_BUTTONS_DEFAULT_SHOW_LABELS) {
      delete newConfig.show_labels;
    }

    // if (!this._config || !this.hass) {
    //   return;
    // }
    // const target = ev.target! as EditorTarget;
    // const configValue =
    //   target.configValue || this._subElementEditorConfig?.type;
    // const value = target.checked ?? ev.detail.value ?? target.value;

    // if (configValue === "button" || (ev.detail && ev.detail.buttons)) {
    //   const newConfigButtons =
    //     ev.detail.buttons || this._config!.buttons.concat();
    //   if (configValue === "button") {
    //     if (!value) {
    //       newConfigButtons.splice(this._subElementEditorConfig!.index!, 1);
    //       this._goBack();
    //     } else {
    //       newConfigButtons[this._subElementEditorConfig!.index!] = value;
    //     }

    //     this._subElementEditorConfig!.elementConfig = value;
    //   }

    //   this._config = { ...this._config!, buttons: newConfigButtons };
    // } else if (configValue) {
    //   if (!value) {
    //     this._config = { ...this._config };
    //     delete this._config[configValue!];
    //   } else {
    //     this._config = {
    //       ...this._config,
    //       [configValue!]: value,
    //     };
    //   }
    // }

    fireEvent(this, "config-changed", { config: newConfig });
  }

  // private _handleSubElementChanged(ev: CustomEvent): void {
  //   ev.stopPropagation();
  //   if (!this._config || !this.hass) {
  //     return;
  //   }

  //   const configValue = this._subElementEditorConfig?.type;
  //   const value = ev.detail.config;

  //   if (configValue === "buttons") {
  //     const newConfigButtons = this._config!.buttons!.concat();
  //     if (!value) {
  //       newConfigButtons.splice(this._subElementEditorConfig!.index!, 1);
  //       this._goBack();
  //     } else {
  //       newConfigButtons[this._subElementEditorConfig!.index!] = value;
  //     }

  //     this._config = { ...this._config!, buttons: newConfigButtons };
  //   } else if (configValue) {
  //     if (value === "") {
  //       this._config = { ...this._config };
  //       delete this._config[configValue!];
  //     } else {
  //       this._config = {
  //         ...this._config,
  //         [configValue]: value,
  //       };
  //     }
  //   }

  //   this._subElementEditorConfig = {
  //     ...this._subElementEditorConfig!,
  //     elementConfig: value,
  //   };

  //   fireEvent(this, "config-changed", { config: this._config });
  // }

  // private _editDetailElement(
  //   ev: HASSDomEvent<EditSubElementEvent<LovelaceButtonConfig>>
  // ): void {
  //   this._subElementEditorConfig = ev.detail.subElementConfig;
  // }

  // private _goBack(): void {
  //   this._subElementEditorConfig = undefined;
  // }
}
