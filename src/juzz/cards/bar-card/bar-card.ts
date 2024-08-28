import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, nothing, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
  computeRTL,
  computeStateDisplay,
  HomeAssistant,
  isActive,
  isAvailable,
  LovelaceCard,
  LovelaceCardEditor,
} from "../../../ha";
import "../../../shared/badge-icon";
import "../../../shared/button";
import "../../../shared/card";
import "../../../shared/shape-avatar";
import "../../../shared/shape-icon";
import "../../../shared/state-info";
import "../../../shared/state-item";
import "../../../juzz/shared/slider-ex";
import { MushroomBaseCard } from "../../../utils/base-card";
import { cardStyle } from "../../../utils/card-styles";
import { computeRgbColor } from "../../../utils/colors";
import { registerCustomCard } from "../../../utils/custom-cards";
import {
  BAR_CARD_DEFAULT_MAX,
  BAR_CARD_DEFAULT_MIN,
  BAR_CARD_EDITOR_NAME,
  BAR_CARD_NAME,
} from "./const";
import {
  BarCardConfig,
  getMax,
  getMin,
  showIcon,
  showName,
  showState,
} from "./bar-card-config";
import { Appearance } from "../../../shared/config/appearance-config";

registerCustomCard({
  type: BAR_CARD_NAME,
  name: "Mushroom Bar Card",
  description:
    "Card for numeric sensor entities to be represented as a horizontal bar gauge",
});

@customElement(BAR_CARD_NAME)
export class BarCard
  extends MushroomBaseCard<BarCardConfig>
  implements LovelaceCard
{
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./bar-card-editor");
    return document.createElement(BAR_CARD_EDITOR_NAME) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    hass: HomeAssistant
  ): Promise<BarCardConfig> {
    const entities = Object.keys(hass.states).filter(
      (e) =>
        e.split(".")[0] === "sensor" &&
        hass.states[e] &&
        !isNaN(Number(hass.states[e].state))
    );
    return {
      type: `custom:${BAR_CARD_NAME}`,
      entity: entities[0],
      min: BAR_CARD_DEFAULT_MIN,
      max: BAR_CARD_DEFAULT_MAX,
    };
  }

  protected get hasControls(): boolean {
    if (!this._config) return false;
    return (
      Boolean(showIcon(this._config)) ||
      Boolean(showName(this._config)) ||
      Boolean(showState(this._config))
    );
  }

  private computeSeverity(
    config: BarCardConfig,
    numberValue: number
  ): string | undefined {
    return (
      config.segments
        ?.filter((segment) => numberValue >= segment.from)
        ?.sort((a, b) => b.from - a.from)
        .shift()?.color ?? this._config?.icon_color
    );
  }

  protected render() {
    if (!this._config || !this.hass || !this._config.entity) {
      return nothing;
    }

    const stateObj = this._stateObj;

    if (!stateObj) {
      return this.renderNotFound(this._config);
    }

    const available = isAvailable(stateObj);
    const name = this._config.name || stateObj.attributes.friendly_name || "";
    const icon = this._config.icon;

    const stateDisplay = this.hass.formatEntityState
      ? this.hass.formatEntityState(stateObj)
      : computeStateDisplay(
          this.hass.localize,
          stateObj,
          this.hass.locale,
          this.hass.config,
          this.hass.entities
        );

    const rtl = computeRTL(this.hass);
    const appearance: Appearance = {
      layout: this._config.layout ?? "default",
      fill_container: this._config.fill_container ?? false,
      primary_info: showName(this._config) ? "name" : "none",
      secondary_info: showState(this._config) ? "state" : "none",
      icon_type: showIcon(this._config) ? "icon" : "none",
    };

    const entityState = available ? Number(stateObj.state) : Number(0);

    const sliderStyle = {};
    const sliderColor = this.computeSeverity(this._config, entityState);
    if (sliderColor) {
      const iconRgbColor = computeRgbColor(sliderColor);
      sliderStyle["--main-color"] = `rgb(${iconRgbColor})`;
      sliderStyle["--bg-color"] = `rgba(${iconRgbColor}, 0.2)`;
    }

    return html`
      <ha-card
        class=${classMap({ "fill-container": appearance.fill_container })}
      >
        <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
          <mushroom-state-item ?rtl=${rtl} .appearance=${appearance}>
            ${this.renderIcon(stateObj, icon)} ${this.renderBadge(stateObj)}
            ${this.renderStateInfo(stateObj, appearance, name, stateDisplay)};
          </mushroom-state-item>
          <div class="actions" ?rtl=${rtl}>
            <mushroom-slider-ex
              .value=${entityState}
              .controllable=${false}
              .disabled=${!available}
              .inactive=${!isActive(stateObj)}
              .showActive=${true}
              .min=${getMin(this._config)}
              .max=${getMax(this._config)}
              style=${styleMap(sliderStyle)}
            ></mushroom-slider-ex>
          </div>
        </mushroom-card>
      </ha-card>
    `;
  }

  renderIcon(stateObj: HassEntity, icon?: string): TemplateResult {
    const active = isActive(stateObj);
    const iconStyle = {};
    const iconColor = this._config?.icon_color;
    if (iconColor) {
      const iconRgbColor = computeRgbColor(iconColor);
      iconStyle["--icon-color"] = `rgb(${iconRgbColor})`;
      iconStyle["--shape-color"] = `rgba(${iconRgbColor}, 0.2)`;
    }
    return html`
      <mushroom-shape-icon
        slot="icon"
        .disabled=${!active}
        style=${styleMap(iconStyle)}
      >
        <ha-state-icon
          .hass=${this.hass}
          .stateObj=${stateObj}
          .icon=${icon}
        ></ha-state-icon>
      </mushroom-shape-icon>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      cardStyle,
      css`
        mushroom-shape-icon {
          --icon-color: rgb(var(--rgb-state-number));
          --shape-color: rgba(var(--rgb-state-number), 0.2);
        }
        mushroom-slider-ex {
          --main-color: rgb(var(--rgb-state-number));
          --bg-color: rgba(var(--rgb-state-number), 0.2);
          flex: 1;
        }
      `,
    ];
  }
}
