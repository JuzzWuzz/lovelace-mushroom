import { html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";
import { assert } from "superstruct";
import { LovelaceCardEditor, fireEvent } from "../../../ha";
import setupCustomlocalize from "../../../localize";
import { MushroomBaseElement } from "../../../utils/base-element";
import { GENERIC_LABELS } from "../../../utils/form/generic-fields";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { loadHaComponents } from "../../../utils/loader";
import { BASE_DEVICE_FORM_SCHEMA } from "../../shared/config/base-device-config";
import { computeSimpleAppearanceFormSchema } from "../../shared/config/simple-layout-config";
import { ENTITY_TYPES } from "../../utils/base-device-card";
import { capitalizeWords } from "../../utils/helpers";
import {
  ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN,
  ZIGBEE2MQTT_CARD_DEFAULT_SHOW_RELATED_ENTITIES,
  ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME,
  ZIGBEE2MQTT_CARD_DOMAINS,
  ZIGBEE2MQTT_CARD_EDITOR_NAME,
  ZIGBEE2MQTT_CARD_DEFAULT_SHOW_POWER_STATUS,
  ZIGBEE2MQTT_CARD_DEFAULT_SHOW_DEVICE_CONTROLS,
} from "./const";
import {
  showDeviceControls,
  showLastSeen,
  showPowerStatus,
  showRelatedEntities,
  useDeviceName,
  Zigbee2MQTTCardConfig,
  Zigbee2MQTTCardConfigStruct,
} from "./zigbee2mqtt-card-config";

const ENTITY_TYPE_OPTIONS = [
  { value: "auto", label: "Auto Detect" },
  ...ENTITY_TYPES.map((t) => ({ value: t, label: capitalizeWords(t) })),
];

const computeSchema = memoizeOne(
  (customLocalize: ReturnType<typeof setupCustomlocalize>): HaFormSchema[] => [
    {
      name: "entity",
      selector: { entity: { domain: ZIGBEE2MQTT_CARD_DOMAINS } },
    },
    { name: "name", selector: { text: {} } },
    {
      type: "grid",
      name: "",
      schema: [
        {
          name: "entity_type",
          selector: {
            select: { options: ENTITY_TYPE_OPTIONS, mode: "dropdown" },
          },
        },
        { name: "icon_color", selector: { ui_color: {} } },
      ],
    },
    ...computeSimpleAppearanceFormSchema(customLocalize),
    ...BASE_DEVICE_FORM_SCHEMA,
    {
      type: "grid",
      name: "",
      schema: [
        { name: "show_power_status", selector: { boolean: {} } },
        { name: "show_related_entities", selector: { boolean: {} } },
        { name: "show_last_seen", selector: { boolean: {} } },
      ],
    },
  ]
);

@customElement(ZIGBEE2MQTT_CARD_EDITOR_NAME)
export class Zigbee2MQTTCardEditor
  extends MushroomBaseElement
  implements LovelaceCardEditor
{
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
    if (schema.name === "show_device_controls") {
      return "Show Device Controls?";
    }
    if (schema.name === "show_power_status") {
      return "Show Power Status?";
    }
    if (schema.name === "show_related_entities") {
      return "Show Related Entities?";
    }
    if (schema.name === "show_last_seen") {
      return "Show Last Seen?";
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

    const data: Zigbee2MQTTCardConfig = { ...this._config };

    // Handle setting defaults
    data.use_device_name = useDeviceName(data);
    data.show_device_controls = showDeviceControls(data);
    data.show_power_status = showPowerStatus(data);
    data.show_related_entities = showRelatedEntities(data);
    data.show_last_seen = showLastSeen(data);

    // Use sentinel "auto" so the label floats correctly when no entity_type is set
    const displayData = { ...data, entity_type: data.entity_type ?? "auto" };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${displayData}
        .schema=${schema}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    // Delete default values
    const newConfig = { ...ev.detail.value };
    if (newConfig.entity_type === "auto") {
      delete newConfig.entity_type;
    }
    if (newConfig.fill_container === false) {
      delete newConfig.fill_container;
    }
    if (
      newConfig.use_device_name === ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME
    ) {
      delete newConfig.use_device_name;
    }
    if (
      newConfig.show_device_controls ===
      ZIGBEE2MQTT_CARD_DEFAULT_SHOW_DEVICE_CONTROLS
    ) {
      delete newConfig.show_device_controls;
    }
    if (
      newConfig.show_power_status === ZIGBEE2MQTT_CARD_DEFAULT_SHOW_POWER_STATUS
    ) {
      delete newConfig.show_power_status;
    }
    if (
      newConfig.show_related_entities ===
      ZIGBEE2MQTT_CARD_DEFAULT_SHOW_RELATED_ENTITIES
    ) {
      delete newConfig.show_related_entities;
    }
    if (newConfig.show_last_seen === ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN) {
      delete newConfig.show_last_seen;
    }
    fireEvent(this, "config-changed", { config: newConfig });
  }
}
