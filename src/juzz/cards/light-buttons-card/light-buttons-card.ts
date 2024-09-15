import { css, CSSResultGroup, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
  computeRTL,
  HomeAssistant,
  isActive,
  LightEntity,
  LovelaceCard,
  LovelaceCardEditor,
} from "../../../ha";
// import "../../shared/badge-icon";
// import "../../shared/card";
// import "../../shared/shape-avatar";
// import "../../shared/shape-icon";
// import "../../shared/state-info";
// import "../../shared/state-item";
import { MushroomBaseElement } from "../../../utils/base-element";
import { cardStyle } from "../../../utils/card-styles";
import { computeRgbColor } from "../../../utils/colors";
import { registerCustomCard } from "../../../utils/custom-cards";
import { LovelaceButtonConfig } from "./buttons/types";
import {
  LIGHT_ENTITY_DOMAINS,
  LIGHT_BUTTONS_CARD_EDITOR_NAME,
  LIGHT_BUTTONS_CARD_NAME,
  LIGHT_BUTTONS_DEFAULT_SHOW_LABELS,
} from "./const";
import {
  LightButtonsCardConfig,
  configShowLabels,
} from "./light-buttons-card-config";
import { getBrightness } from "../../../cards/light-card/utils";

registerCustomCard({
  type: LIGHT_BUTTONS_CARD_NAME,
  name: "Mushroom Entity Buttons Card",
  description: "Card for buttons designed to control light scenes",
});

@customElement(LIGHT_BUTTONS_CARD_NAME)
export class LightButtonsCard extends LitElement implements LovelaceCard {
  @state() protected _config?: LightButtonsCardConfig;
  @property({ attribute: false }) public hass?: HomeAssistant;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./light-buttons-card-editor");
    return document.createElement(
      LIGHT_BUTTONS_CARD_EDITOR_NAME
    ) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    hass: HomeAssistant
  ): Promise<LightButtonsCardConfig> {
    const entities = Object.keys(hass.states);
    const lights = entities.filter((e) =>
      LIGHT_ENTITY_DOMAINS.includes(e.split(".")[0])
    );
    return {
      type: `custom:${LIGHT_BUTTONS_CARD_NAME}`,
      entity: lights[0],
      buttons: [],
    };
  }

  getCardSize(): number | Promise<number> {
    return 1;
  }

  public setConfig(config: LightButtonsCardConfig): void {
    this._config = config;
  }

  protected render() {
    if (!this._config || !this.hass || !this._config.entity) {
      return nothing;
    }

    const entityId = this._config.entity;
    const lightEntity = this.hass.states[entityId] as LightEntity;

    if (!lightEntity) {
      return html`
        <ha-alert alert-type="warning"
          >${this.hass.localize("ui.panel.lovelace.warning.entity_not_found", {
            entity: entityId || "[empty]",
          })}</ha-alert
        >
      `;
    }

    let alignment = "";
    if (this._config.alignment) {
      alignment = `align-${this._config.alignment}`;
    }
    const showLabels = configShowLabels(this._config);

    const rtl = computeRTL(this.hass);

    return html`
      <ha-card>
        <div
          class=${classMap({
            "button-container": true,
            [alignment]: true,
            "show-labels": showLabels,
          })}
          ?rtl=${rtl}
        >
          ${this._config.buttons.map((button) =>
            this.renderButton(button, lightEntity, showLabels)
          )}
        </div>
      </ha-card>
    `;
  }

  private renderButton(
    buttonConfig: LovelaceButtonConfig,
    lightEntity: LightEntity,
    showLabels: boolean
  ) {
    const icon = buttonConfig.icon;
    const active = isActive(lightEntity);
    const iconStyle = {};
    const buttonColor = (() => {
      function checkBrightness(): boolean {
        const configBrightness = buttonConfig["brightness_pct"] ?? null;
        return (
          configBrightness === null ||
          configBrightness === getBrightness(lightEntity)
        );
      }
      function checkKelvin(): boolean {
        const configKelvin = buttonConfig["kelvin"] ?? null;
        return (
          configKelvin === null ||
          Math.floor(1000000 / configKelvin) ===
            lightEntity.attributes.color_temp
        );
      }
      switch (buttonConfig.type) {
        case "toggle": {
          if (active) {
            return "accent";
          }
          break;
        }
        case "effect": {
          if (
            checkBrightness() &&
            buttonConfig.effect === lightEntity.attributes.effect
          ) {
            return "green";
          }
          break;
        }
        case "turn-on": {
          if (checkBrightness() && checkKelvin()) {
            return "green";
          }
        }
      }
      return "primary";
    })();
    const color = computeRgbColor(buttonColor);
    iconStyle["--icon-color"] = `rgb(${color})`;
    iconStyle["--shape-color"] = `rgba(${color}, 0.25)`;

    const label = buttonConfig.label;

    return html`
      <div class="button">
        <mushroom-shape-icon
          .disabled=${!active}
          @click=${(e) => this._handleAction(e, buttonConfig)}
          style=${styleMap(iconStyle)}
        >
          <ha-state-icon
            .hass=${this.hass}
            .stateObj=${lightEntity}
            .icon=${icon}
          ></ha-state-icon>
        </mushroom-shape-icon>
        ${showLabels && label ? html`<span>${label}</span>` : nothing}
      </div>
    `;
  }

  private _handleAction(e: CustomEvent, buttonConfig: LovelaceButtonConfig) {
    e.stopPropagation();
    if (!this._config || !this.hass || !this._config.entity) {
      return;
    }
    const serviceData = {
      entity_id: this._config.entity,
    };
    switch (buttonConfig.type) {
      case "effect": {
        serviceData["effect"] = buttonConfig.effect;
        if (buttonConfig.brightness_pct) {
          serviceData["brightness_pct"] = buttonConfig.brightness_pct;
        }
        this.hass.callService("light", "turn_on", serviceData);
        break;
      }
      case "turn-on": {
        if (buttonConfig.brightness_pct) {
          serviceData["brightness_pct"] = buttonConfig.brightness_pct;
        }
        if (buttonConfig.kelvin) {
          serviceData["kelvin"] = buttonConfig.kelvin;
        }
        this.hass.callService("light", "turn_on", serviceData);
        break;
      }
      case "toggle": {
        this.hass.callService("light", "toggle", serviceData);
        break;
      }
    }
  }

  static get styles(): CSSResultGroup {
    return [
      MushroomBaseElement.styles,
      cardStyle,
      css`
        .button-container {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          justify-content: flex-start;
          flex-wrap: wrap;
          padding: var(--spacing);
          gap: var(--spacing);
        }
        .button-container.align-end {
          justify-content: flex-end;
        }
        .button-container.align-center {
          justify-content: center;
        }
        .button-container.align-justify {
          justify-content: space-between;
        }
        .button-container.show-labels > .button {
          max-width: calc(var(--icon-size) * 2);
        }
        .button {
          display: flex;
          flex-direction: column;
          align-items: center;
          row-gap: calc(var(--chip-spacing) / 2);
        }
        .button > mushroom-shape-icon {
          cursor: pointer;
          --icon-color: rgb(var(--rgb-state-light));
          --shape-color: rgba(var(--rgb-state-light), 0.2);
        }
        .button > span {
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          font-weight: var(--card-secondary-font-weight);
          font-size: var(--card-secondary-font-size);
          line-height: var(--card-secondary-line-height);
          letter-spacing: var(--card-secondary-letter-spacing);
        }
      `,
    ];
  }
}
