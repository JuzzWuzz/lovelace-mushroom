import { css, CSSResultGroup, html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
  actionHandler,
  ActionHandlerEvent,
  computeRTL,
  computeStateDisplay,
  handleAction,
  hasAction,
  HomeAssistant,
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
import { computeAppearance } from "../../../utils/appearance";
import { MushroomBaseCard } from "../../../utils/base-card";
import { cardStyle } from "../../../utils/card-styles";
import { computeRgbColor } from "../../../utils/colors";
import { registerCustomCard } from "../../../utils/custom-cards";
import {
  FORMATTED_SENSOR_CARD_DEFAULT_CLAMP_NEGATIVE,
  FORMATTED_SENSOR_CARD_EDITOR_NAME,
  FORMATTED_SENSOR_CARD_NAME,
} from "./const";
import {
  FormattedSensorCardConfig,
  showIcon,
  showName,
  showState,
} from "./formatted-sensor-card-config";
import {
  formatValueAndUom,
  getDataTypeForDeviceClass,
} from "../../utils/helpers";
import { Layout } from "../../../utils/layout";

registerCustomCard({
  type: FORMATTED_SENSOR_CARD_NAME,
  name: "Mushroom Formatted Sensor Card",
  description:
    "Card for sensor entities that supports auto-formatting of units",
});

@customElement(FORMATTED_SENSOR_CARD_NAME)
export class FormattedSensorCard
  extends MushroomBaseCard<FormattedSensorCardConfig>
  implements LovelaceCard
{
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./formatted-sensor-card-editor");
    return document.createElement(
      FORMATTED_SENSOR_CARD_EDITOR_NAME
    ) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    hass: HomeAssistant
  ): Promise<FormattedSensorCardConfig> {
    const entities = Object.keys(hass.states).filter(
      (e) =>
        e.split(".")[0] === "sensor" &&
        hass.states[e] &&
        !isNaN(Number(hass.states[e].state))
    );
    return {
      type: `custom:${FORMATTED_SENSOR_CARD_NAME}`,
      entity: entities[0],
    };
  }

  override setConfig(config: FormattedSensorCardConfig): void {
    this._config = {
      primary_info: showName(config) ? "name" : "none",
      secondary_info: showState(config) ? "state" : "none",
      icon_type: showIcon(config) ? "icon" : "none",
      tap_action: {
        action: "none",
      },
      hold_action: {
        action: "more-info",
      },
      ...config,
    };
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }

  protected render() {
    if (!this._config || !this.hass || !this._config.entity) {
      return nothing;
    }

    const stateObj = this._stateObj;

    if (!stateObj) {
      return this.renderNotFound(this._config);
    }

    // Process availability
    const sensorOffline = [UNAVAILABLE, UNKNOWN].includes(stateObj.state);

    // Process the name
    const name = this._config.name || stateObj.attributes.friendly_name || "";

    // Process the state
    const clampNegative =
      this._config.clamp_negative ??
      FORMATTED_SENSOR_CARD_DEFAULT_CLAMP_NEGATIVE;
    console.log(stateObj.attributes);
    const dataType =
      this._config.data_type ??
      getDataTypeForDeviceClass(stateObj.attributes.device_class);
    const stateDisplay = sensorOffline
      ? "Sensor Offline"
      : dataType !== undefined
        ? formatValueAndUom(stateObj.state, dataType, clampNegative).formatted()
        : this.hass.formatEntityState
          ? this.hass.formatEntityState(stateObj)
          : computeStateDisplay(
              this.hass.localize,
              stateObj,
              this.hass.locale,
              this.hass.config,
              this.hass.entities
            );
    const stateStyle = {};
    const stateColor = this._config?.state_color;
    if (stateColor) {
      const stateRgbColor = computeRgbColor(stateColor);
      stateStyle["--state-color"] = `rgb(${stateRgbColor})`;
    }

    // Process the icon
    const icon = this._config.icon;
    const iconStyle = {};
    const iconColor = this._config?.icon_color;
    if (iconColor) {
      const iconRgbColor = computeRgbColor(iconColor);
      iconStyle["--icon-color"] = `rgb(${iconRgbColor})`;
      iconStyle["--shape-color"] = `rgba(${iconRgbColor}, 0.2)`;
    }

    const rtl = computeRTL(this.hass);
    const appearance = computeAppearance(this._config);

    return html`
      <ha-card
        class=${classMap({ "fill-container": appearance.fill_container })}
      >
        <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
          <mushroom-state-item
            ?rtl=${rtl}
            .appearance=${appearance}
            @action=${this._handleAction}
            .actionHandler=${actionHandler({
              hasHold: hasAction(this._config.hold_action),
              hasDoubleClick: hasAction(this._config.double_tap_action),
            })}
          >
            <mushroom-shape-icon
              slot="icon"
              .disabled=${sensorOffline}
              style=${styleMap(iconStyle)}
            >
              <ha-state-icon
                .hass=${this.hass}
                .stateObj=${stateObj}
                .icon=${icon}
              ></ha-state-icon>
            </mushroom-shape-icon>
            <div slot="info">
              ${this.renderInLayout(
                appearance.layout,
                name,
                stateDisplay,
                stateStyle
              )}
            </div>
          </mushroom-state-item>
        </mushroom-card>
      </ha-card>
    `;
  }

  private renderInLayout(
    layout: Layout,
    name: string,
    stateDisplay: string,
    stateStyle: {}
  ) {
    switch (layout) {
      case "default": {
        return html`
          <mushroom-row-container .rowType=${"primary"}>
            <span>${name}</span>
          </mushroom-row-container>
          <mushroom-row-container .rowType=${"secondary"}>
            <span class="state" style=${styleMap(stateStyle)}
              >${stateDisplay}</span
            >
          </mushroom-row-container>
        `;
      }
      case "horizontal": {
        return html`
          <mushroom-row-container .rowType=${"primary"}>
            <span>${name}</span>
            <div class="spacer"></div>
            <span class="state" style=${styleMap(stateStyle)}
              >${stateDisplay}</span
            >
          </mushroom-row-container>
        `;
      }
      case "vertical": {
        return html`
          <mushroom-row-container .rowType=${"primary"} .alignment=${"center"}>
            <span>${name}</span>
          </mushroom-row-container>
          <mushroom-row-container .rowType=${"primary"} .alignment=${"center"}>
            <span class="state huge" style=${styleMap(stateStyle)}
              >${stateDisplay}</span
            >
          </mushroom-row-container>
        `;
      }
    }
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      cardStyle,
      css`
        mushroom-shape-icon {
          --icon-color: rgb(var(--rgb-state-entity));
          --shape-color: rgba(var(--rgb-state-entity), 0.2);
        }
        .state {
          color: var(--state-color, --secondary-text-color);
          font-weight: var(--card-secondary-font-weight);
        }
        .huge {
          font-size: calc(var(--card-primary-font-size) * 1.5);
        }
      `,
    ];
  }
}
