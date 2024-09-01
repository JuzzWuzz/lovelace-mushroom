import {
  css,
  html,
  CSSResultGroup,
  LitElement,
  TemplateResult,
  nothing,
} from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  computeRTL,
  fireEvent,
  DeviceRegistryEntry,
  HomeAssistant,
} from "../../../ha";

export interface UpdateVersionConfig {
  version: string;
  entityId: string;
}
export interface UpdateConfig {
  showButtons: boolean;
  canInstall: boolean;
  installing: boolean;
  beta?: UpdateVersionConfig;
  stable?: UpdateVersionConfig;
}

@customElement("mushroom-device-card-controls")
export class DeviceCardControls extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public device?: DeviceRegistryEntry;

  @property({ type: Boolean }) public fill: boolean = false;

  @property({ attribute: false }) public updateConfig?: UpdateConfig;

  protected render(): TemplateResult {
    const rtl = computeRTL(this.hass);

    return html`
      <mushroom-button-group .fill=${this.fill} ?rtl=${rtl}>
        ${this.renderUpdateButtons()}
        <mushroom-button @click=${this._handleDeviceInfo}>
          <ha-icon .icon=${"mdi:cog-outline"}></ha-icon>
        </mushroom-button>
      </mushroom-button-group>
    `;
  }

  private renderUpdateButtons() {
    if (!this.updateConfig?.showButtons) {
      return nothing;
    }
    return html`
      ${this.updateConfig.beta
        ? html`
            <mushroom-button
              .disabled=${this.updateConfig.installing}
              .title=${this.updateConfig.beta.version}
              @click=${this._handleInstallBeta}
              ><ha-icon .icon=${"mdi:beta"}></ha-icon>
            </mushroom-button>
          `
        : nothing}
      ${this.updateConfig.stable
        ? html`
            <mushroom-button
              .disabled=${this.updateConfig.installing}
              .title=${this.updateConfig.stable.version}
              @click=${this._handleInstallStable}
              ><ha-icon .icon=${"mdi:cellphone-arrow-down"}></ha-icon>
            </mushroom-button>
          `
        : nothing}
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      mushroom-button-group {
        width: fit-content;
      }
      mushroom-button-group > mushroom-button {
        width: calc(var(--control-height) * var(--control-button-ratio));
        --bg-color: rgba(var(--rgb-disabled), 0.1);
        --bg-color-disabled: rgba(var(--rgb-disabled), 0.1);
      }
    `;
  }

  protected _handleDeviceInfo(): void {
    if (!this.device) return;

    fireEvent(this, "hass-action", {
      config: {
        tap_action: {
          action: "navigate",
          navigation_path: `/config/devices/device/${this.device.id}`,
        },
      },
      action: "tap",
    });
  }

  protected _handleInstallBeta(): void {
    if (this.updateConfig?.canInstall && this.updateConfig.beta) {
      this.hass.callService("update", "install", {
        entity_id: this.updateConfig.beta.entityId,
      });
    }
  }

  protected _handleInstallStable(): void {
    if (this.updateConfig?.canInstall && this.updateConfig.stable) {
      this.hass.callService("update", "install", {
        entity_id: this.updateConfig.stable.entityId,
      });
    }
  }
}
