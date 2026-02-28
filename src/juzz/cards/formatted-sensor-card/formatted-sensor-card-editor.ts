import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";
import { assert } from "superstruct";
import { fireEvent, LovelaceCardEditor } from "../../../ha";
import setupCustomlocalize from "../../../localize";
import { MushroomBaseElement } from "../../../utils/base-element";
import { GENERIC_LABELS } from "../../../utils/form/generic-fields";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { loadHaComponents } from "../../../utils/loader";
import { computeSimpleAppearanceFormSchema } from "../../shared/config/simple-layout-config";
import { capitalizeWords } from "../../utils/helpers";
import { DATA_TYPES } from "../../utils/types";
import {
  FORMATTED_SENSOR_CARD_DEFAULT_CLAMP_NEGATIVE,
  FORMATTED_SENSOR_CARD_DEFAULT_SHOW_ICON,
  FORMATTED_SENSOR_CARD_DEFAULT_SHOW_NAME,
  FORMATTED_SENSOR_CARD_DEFAULT_SHOW_STATE,
  FORMATTED_SENSOR_CARD_EDITOR_NAME,
} from "./const";
import {
  clampNegative,
  FormattedSensorCardConfig,
  FormattedSensorCardConfigStruct,
  showIcon,
  showName,
  showState,
} from "./formatted-sensor-card-config";

const DATA_TYPE_OPTIONS = [
  { value: "", label: "Auto Detect" },
  ...DATA_TYPES.map((t) => ({ value: t, label: capitalizeWords(t) })),
];

const computeSchema = memoizeOne(
  (customLocalize: ReturnType<typeof setupCustomlocalize>): HaFormSchema[] => [
    { name: "entity", selector: { entity: { domain: "sensor" } } },
    { name: "name", selector: { text: {} } },
    {
      type: "grid",
      name: "",
      schema: [
        {
          name: "data_type",
          selector: { select: { options: DATA_TYPE_OPTIONS, mode: "dropdown" } },
        },
        { name: "state_color", selector: { ui_color: {} } },
      ],
    },
    {
      type: "grid",
      name: "",
      schema: [
        {
          name: "icon",
          selector: { icon: {} },
          context: { icon_entity: "entity" },
        },
        { name: "icon_color", selector: { ui_color: {} } },
      ],
    },
    ...computeSimpleAppearanceFormSchema(customLocalize),
    {
      type: "grid",
      name: "",
      schema: [
        { name: "show_icon", selector: { boolean: {} } },
        { name: "show_name", selector: { boolean: {} } },
        { name: "show_state", selector: { boolean: {} } },
        { name: "clamp_negative", selector: { boolean: {} } },
      ],
    },
  ]
);

@customElement(FORMATTED_SENSOR_CARD_EDITOR_NAME)
export class FormattedSensorCardEditor
  extends MushroomBaseElement
  implements LovelaceCardEditor
{
  @state() private _config?: FormattedSensorCardConfig;

  connectedCallback() {
    super.connectedCallback();
    void loadHaComponents();
  }

  public setConfig(config: FormattedSensorCardConfig): void {
    assert(config, FormattedSensorCardConfigStruct);
    this._config = config;
  }

  private _computeLabel = (schema: HaFormSchema) => {
    const customLocalize = setupCustomlocalize(this.hass!);

    if (GENERIC_LABELS.includes(schema.name)) {
      return customLocalize(`editor.card.generic.${schema.name}`);
    }
    if (schema.name === "data_type") {
      return "Data Type";
    }
    if (schema.name === "state_color") {
      return "State Color";
    }
    if (schema.name === "clamp_negative") {
      return "Clamp Negative Values?";
    }

    return this.hass!.localize(
      `ui.panel.lovelace.editor.card.generic.${schema.name}`
    );
  };

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const customLocalize = setupCustomlocalize(this.hass);
    const schema = computeSchema(customLocalize);

    const data: FormattedSensorCardConfig = { ...this._config };

    // Handle setting defaults
    data.show_icon = showIcon(data);
    data.show_name = showName(data);
    data.show_state = showState(data);
    data.clamp_negative = clampNegative(data);

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    // Delete default values
    let newConfig = { ...ev.detail.value };
    if (!newConfig.data_type) {
      delete newConfig.data_type;
    }
    if (newConfig.fill_container === false) {
      delete newConfig.fill_container;
    }
    if (newConfig.show_icon === FORMATTED_SENSOR_CARD_DEFAULT_SHOW_ICON) {
      delete newConfig.show_icon;
    }
    if (newConfig.show_name === FORMATTED_SENSOR_CARD_DEFAULT_SHOW_NAME) {
      delete newConfig.show_name;
    }
    if (newConfig.show_state === FORMATTED_SENSOR_CARD_DEFAULT_SHOW_STATE) {
      delete newConfig.show_state;
    }
    if (
      newConfig.clamp_negative === FORMATTED_SENSOR_CARD_DEFAULT_CLAMP_NEGATIVE
    ) {
      delete newConfig.clamp_negative;
    }
    fireEvent(this, "config-changed", { config: newConfig });
  }
}
