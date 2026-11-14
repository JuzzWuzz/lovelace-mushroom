import { HassEntity } from "home-assistant-js-websocket";
import { html, nothing, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import {
  computeRTL,
  HomeAssistant,
  LovelaceCard,
  LovelaceCardEditor,
  UNAVAILABLE,
  UNKNOWN,
} from "../../../ha";
// import "../../../shared/badge-icon";
// import "../../../shared/card";
// import "../../../shared/shape-avatar";
// import "../../../shared/shape-icon";
// import "../../../shared/state-info";
// import "../../../shared/state-item";
import { computeAppearance } from "../../../utils/appearance";
import { computeEntityName } from "../../../utils/compute-entity-name";
import {
  EntityType,
  MushroomBaseDeviceCard,
} from "../../utils/base-device-card";
import { computeRgbColor } from "../../../utils/colors";
import { registerCustomCard } from "../../../utils/custom-cards";
import {
  ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME,
  ZIGBEE2MQTT_CARD_DOMAINS,
  ZIGBEE2MQTT_CARD_EDITOR_NAME,
  ZIGBEE2MQTT_CARD_NAME,
} from "./const";
import {
  showLastSeen,
  showRelatedEntities,
  showPowerStatus,
  Zigbee2MQTTCardConfig,
  showDeviceControls,
} from "./zigbee2mqtt-card-config";
import { classMap } from "lit/directives/class-map.js";

registerCustomCard({
  type: ZIGBEE2MQTT_CARD_NAME,
  name: "Mushroom Zigbee2MQTT Card",
  description:
    "Card for Zigbee2MQTT sensors, lights, and wireless buttons. Shows primary and related device information",
});

@customElement(ZIGBEE2MQTT_CARD_NAME)
export class Zigbee2MQTTCard
  extends MushroomBaseDeviceCard<Zigbee2MQTTCardConfig>
  implements LovelaceCard
{
  // Override default value
  protected useDeviceNameDefault: boolean =
    ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./zigbee2mqtt-card-editor");
    return document.createElement(
      ZIGBEE2MQTT_CARD_EDITOR_NAME
    ) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    hass: HomeAssistant
  ): Promise<Zigbee2MQTTCardConfig> {
    const entities = Object.keys(hass.states);
    const updateEntities = entities.filter((e) =>
      ZIGBEE2MQTT_CARD_DOMAINS.includes(e.split(".")[0])
    );
    return {
      type: `custom:${ZIGBEE2MQTT_CARD_NAME}`,
      entity: updateEntities[0],
    };
  }

  override setConfig(config: Zigbee2MQTTCardConfig): void {
    this._config = {
      primary_info: "name",
      secondary_info: "state",
      icon_type: "icon",
      ...config,
    };
  }

  protected get hasControls(): boolean {
    return !!(this._config && showDeviceControls(this._config));
  }

  protected render() {
    if (!this._config || !this.hass || !this._config.entity) {
      return nothing;
    }

    const stateObj = this._stateObj;

    if (!stateObj) {
      return this.renderNotFound(this._config);
    }

    const entityType =
      this._config.entity_type ?? this.computeEntityType(stateObj);
    const wirelessButton = entityType === "wireless_button";

    // A momentary action sensor can legitimately be blank or unknown.
    const deviceOffline =
      stateObj.state === UNAVAILABLE ||
      (!wirelessButton && stateObj.state === UNKNOWN);

    // Get the related entities (To add in their values on the screen)
    let relatedEntities: HassEntity[] = this.getDeviceEntities(entityType);
    const batteryEntity = relatedEntities.find((e) =>
      e.entity_id.endsWith("battery")
    );
    const lastSeenEntity = relatedEntities.find((e) =>
      e.entity_id.endsWith("last_seen")
    );
    relatedEntities = relatedEntities.filter(
      (e) => e !== batteryEntity && e !== lastSeenEntity
    );

    // Process the name
    const name = computeEntityName(
      this.hass,
      stateObj,
      this._config.name || this.getDeviceName()
    );

    // Process the state
    const stateDisplay = deviceOffline
      ? "Device offline"
      : wirelessButton
        ? ""
        : this.getStateDisplay(stateObj);

    // Process the icon
    const iconStyle = {};
    const iconColor = this.getIconColor(entityType, this._config.icon_color);
    if (iconColor) {
      const iconRgbColor = computeRgbColor(iconColor);
      iconStyle["--icon-color"] = `rgb(${iconRgbColor})`;
      iconStyle["--shape-color"] = `rgba(${iconRgbColor}, 0.2)`;
    }

    const rtl = computeRTL(this.hass);
    const appearance = computeAppearance(this._config);
    const lastSeen = this.renderLastSeen(lastSeenEntity);
    const hasRelatedEntities =
      !deviceOffline &&
      showRelatedEntities(this._config) &&
      relatedEntities.length > 0;
    const showSecondaryRow =
      !wirelessButton ||
      deviceOffline ||
      lastSeen !== nothing ||
      (appearance.layout === "horizontal" && hasRelatedEntities);

    return html`
      <ha-card
        class=${classMap({ "fill-container": appearance.fill_container })}
      >
        <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
          <mushroom-state-item .appearance=${appearance} ?rtl=${rtl}>
            <mushroom-shape-icon
              slot="icon"
              .disabled=${deviceOffline}
              style=${styleMap(iconStyle)}
            >
              <ha-state-icon
                .hass=${this.hass}
                .stateObj=${stateObj}
              ></ha-state-icon>
            </mushroom-shape-icon>
            <div slot="info">
              <mushroom-row-container .rowType=${"primary"}>
                <span>${name}</span>
                <div class="spacer"></div>
                ${this.renderPowerState(
                  deviceOffline,
                  batteryEntity,
                  !wirelessButton
                )}
              </mushroom-row-container>
              ${showSecondaryRow
                ? html`
                    <mushroom-row-container
                      .rowType=${"secondary"}
                      .tightSpacing=${true}
                    >
                      ${stateDisplay
                        ? html`<span>${stateDisplay}</span>`
                        : nothing}
                      <div class="spacer"></div>
                      ${appearance.layout === "horizontal"
                        ? this.renderRelatedEntities(
                            deviceOffline,
                            relatedEntities
                          )
                        : nothing}
                      ${lastSeen}
                    </mushroom-row-container>
                  `
                : nothing}
            </div>
          </mushroom-state-item>
          <div class="actions">
            ${appearance.layout === "horizontal"
              ? this.renderDeviceControls()
              : html`
                  ${!wirelessButton || hasRelatedEntities
                    ? html`
                        <mushroom-row-container
                          .rowType=${"secondary"}
                          .alignment=${"justify"}
                          .noWrap=${false}
                          .tightSpacing=${true}
                        >
                          ${this.renderRelatedEntities(
                            deviceOffline,
                            relatedEntities
                          )}
                        </mushroom-row-container>
                      `
                    : nothing}
                  ${this.renderDeviceControls()}
                `}
          </div>
        </mushroom-card>
      </ha-card>
    `;
  }

  protected override computeEntityType(
    entity: HassEntity
  ): EntityType | undefined {
    const reference = this.hass.entities[entity.entity_id];
    if (
      reference?.device_id &&
      entity.entity_id.startsWith("sensor.") &&
      (reference.translation_key === "action" ||
        entity.entity_id.endsWith("_action"))
    ) {
      // Some HA registry display entries omit platform. In that case,
      // require a same-device battery sensor instead of inferring from
      // an action-like ID alone.
      const isMqttAction =
        reference.platform === "mqtt" ||
        (!reference.platform &&
          Object.values(this.hass.entities).some(
            (entry) =>
              entry.device_id === reference.device_id &&
              entry.entity_id.startsWith("sensor.") &&
              entry.entity_id.endsWith("_battery")
          ));
      if (isMqttAction) return "wireless_button";
    }
    return super.computeEntityType(entity);
  }

  private getIconColor(entityType?: EntityType, configIconColor?: string) {
    if (configIconColor) {
      return configIconColor;
    }
    switch (entityType) {
      case "air_purifier": {
        return "yellow";
      }
      case "climate": {
        return "purple";
      }
      case "contact": {
        return "cyan";
      }
      case "light": {
        return "deep-orange";
      }
      case "motion": {
        return "pink";
      }
      default: {
        return undefined;
      }
    }
  }

  private renderPowerState(
    deviceOffline: boolean,
    batteryEntity?: HassEntity,
    showMainsFallback = true
  ): TemplateResult | typeof nothing {
    if (!this._config || !showPowerStatus(this._config) || deviceOffline) {
      return nothing;
    }

    return batteryEntity
      ? html`<ha-state-icon
          .hass=${this.hass}
          .stateObj=${batteryEntity}
        ></ha-state-icon>`
      : showMainsFallback
        ? html`<ha-icon icon="mdi:power-plug"></ha-icon>`
        : nothing;
  }

  private renderRelatedEntities(
    deviceOffline: boolean,
    relatedEntities: HassEntity[]
  ): TemplateResult | typeof nothing {
    if (!this._config || !showRelatedEntities(this._config) || deviceOffline) {
      return nothing;
    }

    return html`
      ${relatedEntities.map(
        (e) => html`
          <mushroom-inline-state-item .hass=${this.hass} .state=${e}>
            <span>${this.getStateDisplay(e)}</span>
          </mushroom-inline-state-item>
        `
      )}
    `;
  }

  private renderLastSeen(
    lastSeen?: HassEntity
  ): TemplateResult | typeof nothing {
    if (
      !this._config ||
      !showLastSeen(this._config) ||
      !lastSeen ||
      [UNAVAILABLE, UNKNOWN].includes(lastSeen.state)
    ) {
      return nothing;
    }

    return html`
      <mushroom-inline-state-item .hass=${this.hass}>
        <ha-relative-time
          .hass=${this.hass}
          .datetime=${lastSeen.state}
          capitalize
        ></ha-relative-time>
      </mushroom-inline-state-item>
    `;
  }

  private renderDeviceControls(): TemplateResult | typeof nothing {
    if (!this._config || !showDeviceControls(this._config)) {
      return nothing;
    }

    return html`
      <mushroom-device-card-controls .hass=${this.hass} .device=${this.device}>
      </mushroom-device-card-controls>
    `;
  }
}
