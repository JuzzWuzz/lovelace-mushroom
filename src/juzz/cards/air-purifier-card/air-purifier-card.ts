import { HassEntity } from "home-assistant-js-websocket";
import { html, nothing, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
  ActionConfigParams,
  actionHandler,
  ActionHandlerEvent,
  computeRTL,
  handleAction,
  HomeAssistant,
  isActive,
  LovelaceCard,
  LovelaceCardEditor,
  UNAVAILABLE,
  UNKNOWN,
} from "../../../ha";
// import "../../../shared/badge-icon";
// import "../../../shared/button";
// import "../../../shared/card";
// import "../../../shared/shape-avatar";
// import "../../../shared/shape-icon";
// import "../../../shared/state-info";
// import "../../../shared/state-item";
import { MushroomBaseDeviceCard } from "../../utils/base-device-card";
import { registerCustomCard } from "../../../utils/custom-cards";
import {
  AIR_PURIFIER_CARD_EDITOR_NAME,
  AIR_PURIFIER_CARD_NAME,
  FAN_ENTITY_DOMAINS,
} from "./const";
import {
  AirPurifierCardConfig,
  showDeviceControls,
} from "./air-purifier-card-config";
import { Appearance } from "../../../shared/config/appearance-config";

registerCustomCard({
  type: AIR_PURIFIER_CARD_NAME,
  name: "Mushroom Air Purifier Card",
  description:
    "Card for air purifier to show air quality and other states along with controlling the fan",
});

@customElement(AIR_PURIFIER_CARD_NAME)
export class AirPurifierCard
  extends MushroomBaseDeviceCard<AirPurifierCardConfig>
  implements LovelaceCard
{
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./air-purifier-card-editor");
    return document.createElement(
      AIR_PURIFIER_CARD_EDITOR_NAME
    ) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    hass: HomeAssistant
  ): Promise<AirPurifierCardConfig> {
    const entities = Object.keys(hass.states);
    const fans = entities.filter((e) =>
      FAN_ENTITY_DOMAINS.includes(e.split(".")[0])
    );
    return {
      type: `custom:${AIR_PURIFIER_CARD_NAME}`,
      entity: fans[0],
    };
  }

  protected get hasControls(): boolean {
    return true;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    if (!this.hass) {
      return;
    }
    const actionConfig: ActionConfigParams = {
      entity: this._config?.entity,
      tap_action: {
        action: "toggle",
      },
      hold_action: {
        action: "more-info",
      },
    };
    handleAction(this, this.hass, actionConfig, ev.detail.action!);
  }

  protected render() {
    if (!this._config || !this.hass || !this._config.entity) {
      return nothing;
    }

    const stateObj = this._stateObj;

    if (!stateObj) {
      return this.renderNotFound(this._config);
    }

    // Parse the entity for some fields
    const deviceOffline = [UNAVAILABLE, UNKNOWN].includes(stateObj.state);

    // Get the related entities (To add in their values on the screen)
    let relatedEntities: HassEntity[] = this.getDeviceEntities("air_purifier");

    const name = this._config.name || stateObj.attributes.friendly_name || "";
    const stateDisplay = deviceOffline
      ? "Device offline"
      : this.getStateDisply(stateObj);
    const icon = this._config.icon;
    let iconStyle = {};
    const active = isActive(stateObj);
    if (active) {
      iconStyle["--animation-duration"] = `1s`;
    }

    const rtl = computeRTL(this.hass);
    const appearance: Appearance = {
      layout: this._config.layout ?? "default",
      fill_container: this._config.fill_container ?? false,
      primary_info: "name",
      secondary_info: "state",
      icon_type: "icon",
    };

    return html`
      <ha-card
        class=${classMap({ "fill-container": appearance.fill_container })}
      >
        <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
          <mushroom-state-item .appearance=${appearance} ?rtl=${rtl}>
            <mushroom-shape-icon
              slot="icon"
              class=${classMap({
                action: true,
                spin: active && Boolean(this._config?.icon_animation),
              })}
              style=${styleMap(iconStyle)}
              .disabled=${!active}
              @action=${this._handleAction}
              .actionHandler=${actionHandler({
                hasHold: true,
                hasDoubleClick: false,
              })}
            >
              <ha-state-icon
                .hass=${this.hass}
                .stateObj=${stateObj}
                .icon=${icon}
              ></ha-state-icon>
            </mushroom-shape-icon>
            <div slot="info">
              <mushroom-row-container .rowType=${"primary"}>
                <span>${name}</span>
              </mushroom-row-container>
              <mushroom-row-container .rowType=${"secondary"}>
                <span>${stateDisplay}</span>
                <div class="spacer"></div>
                ${this._config.layout === "horizontal"
                  ? this.renderRelatedEntities(deviceOffline, relatedEntities)
                  : nothing}
              </mushroom-row-container>
            </div>
          </mushroom-state-item>
          <div class="actions">
            ${this._config.layout === "horizontal"
              ? this.renderDeviceControls()
              : html`
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
                  ${this.renderDeviceControls()}
                `}
          </div>
        </mushroom-card>
      </ha-card>
    `;
  }

  private renderRelatedEntities(
    deviceOffline: boolean,
    relatedEntities: HassEntity[]
  ): TemplateResult | typeof nothing {
    if (!this._config || deviceOffline) {
      return nothing;
    }

    return html`
      ${relatedEntities.map(
        (e) => html`
          <mushroom-inline-state-item .hass=${this.hass} .state=${e}>
            <span>${this.getStateDisply(e)}</span>
          </mushroom-inline-state-item>
        `
      )}
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
