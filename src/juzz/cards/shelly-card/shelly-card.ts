import { html, nothing, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
  computeRTL,
  HomeAssistant,
  LovelaceCard,
  LovelaceCardEditor,
  ON,
  UNAVAILABLE,
  UNKNOWN,
} from "../../../ha";
import "../../../shared/badge-icon";
import "../../../shared/card";
import "../../../shared/shape-avatar";
import "../../../shared/shape-icon";
import "../../../shared/state-info";
import "../../../shared/state-item";
import { computeAppearance } from "../../../utils/appearance";
import { MushroomBaseDeviceCard } from "../../utils/base-device-card";
import { computeRgbColor } from "../../../utils/colors";
import { registerCustomCard } from "../../../utils/custom-cards";
import {
  UPDATE_DOMAINS,
  SHELLY_CARD_EDITOR_NAME,
  SHELLY_CARD_NAME,
  SHELLY_CARD_DEFAULT_USE_DEVICE_NAME,
} from "./const";
import { ShellyCardConfig, showDeviceControls } from "./shelly-card-config";
import { UpdateConfig } from "../../utils/controls/device-controls";

registerCustomCard({
  type: SHELLY_CARD_NAME,
  name: "Mushroom Shelly Card",
  description:
    "Card for Shelly devices that can track firmware updates and trigger announcements",
});

@customElement(SHELLY_CARD_NAME)
export class ShellyUpdateCard
  extends MushroomBaseDeviceCard<ShellyCardConfig>
  implements LovelaceCard
{
  // Override default value
  protected useDeviceNameDefault: boolean = SHELLY_CARD_DEFAULT_USE_DEVICE_NAME;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./shelly-card-editor");
    return document.createElement(
      SHELLY_CARD_EDITOR_NAME
    ) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    hass: HomeAssistant
  ): Promise<ShellyCardConfig> {
    const entities = Object.keys(hass.states);
    const updateEntities = entities.filter((e) =>
      UPDATE_DOMAINS.includes(e.split(".")[0])
    );
    return {
      type: `custom:${SHELLY_CARD_NAME}`,
      entity: updateEntities[0],
    };
  }

  override setConfig(config: ShellyCardConfig): void {
    this._config = {
      primary_info: "name",
      secondary_info: "state",
      icon_type: "icon",
      ...config,
    };
  }

  protected get hasControls(): boolean {
    if (!this._config) {
      return false;
    }
    return showDeviceControls(this._config);
  }

  protected render() {
    if (!this._config || !this.hass || !this._config.entity) {
      return nothing;
    }

    const stateObj = this._stateObj;

    if (!stateObj) {
      return this.renderNotFound(this._config);
    }

    const betaEntityId = this._config.beta_entity;
    const betaStateObj = betaEntityId
      ? this.hass.states[betaEntityId]
      : undefined;

    // Process availability
    const deviceOffline = [UNAVAILABLE, UNKNOWN].includes(stateObj.state);

    // Parse the entity for some fields
    const hasBetaUpdate = betaStateObj?.state === ON;
    const hasStableUpdate = stateObj.state === ON;
    const hasUpdate = hasBetaUpdate || hasStableUpdate;
    const installedVersion = stateObj.attributes?.installed_version;
    const latestVersion = stateObj.attributes?.latest_version;
    const installProgress = stateObj.attributes?.in_progress;
    const installing =
      typeof installProgress === "number" || installProgress === true;

    // Process the name
    const name =
      this._config.name ||
      this.getDeviceName() ||
      stateObj.attributes.friendly_name ||
      "";

    // Process the icon and state
    let icon = "mdi:cloud-off-outline";
    let iconColor = "disabled";
    let stateDisplay = "Device offline";
    if (hasUpdate) {
      icon = "mdi:cloud-download-outline";

      if (installing) {
        iconColor = "var(--rgb-state-update-installing)";

        if (typeof installProgress === "number") {
          stateDisplay = `Installing ${installProgress}%`;
        } else {
          stateDisplay = "Installing";
        }
      } else {
        const versionMapping = [installedVersion, latestVersion]
          .filter((s) => (s ?? null) !== null)
          .join(" → ");

        iconColor = "var(--rgb-state-update-on)";
        stateDisplay = versionMapping || "Update available";
      }
    } else if (!deviceOffline) {
      icon = "mdi:cloud-check-outline";
      iconColor = "var(--rgb-state-update-off)";
      stateDisplay = installedVersion || "Up to date";
    }
    const iconRgbColor = computeRgbColor(iconColor);
    const iconStyle = {
      "--icon-color": `rgb(${iconRgbColor})`,
      "--shape-color": `rgba(${iconRgbColor}, 0.2)`,
    };

    // Process the update config
    const updateConfig: UpdateConfig = {
      showButtons: hasUpdate && !deviceOffline && this.isAdmin(),
      canInstall: this.isAdmin(),
      installing: installing,
    };
    if (hasStableUpdate) {
      updateConfig["stable"] = {
        version: latestVersion,
        entityId: stateObj.entity_id,
      };
    }
    if (hasBetaUpdate) {
      updateConfig["beta"] = {
        version: betaStateObj.attributes?.latest_version,
        entityId: betaStateObj.entity_id,
      };
    }

    const rtl = computeRTL(this.hass);
    const appearance = computeAppearance(this._config);

    return html`
      <ha-card
        class=${classMap({ "fill-container": appearance.fill_container })}
      >
        <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
          <mushroom-state-item .appearance=${appearance} ?rtl=${rtl}>
            <mushroom-shape-icon
              slot="icon"
              .disabled=${deviceOffline}
              @click=${this._handleAnnounce}
              style=${styleMap(iconStyle)}
              class=${classMap({
                action: this.isAdmin(),
                pulse: installing,
              })}
            >
              <ha-icon .icon=${icon}></ha-icon>
            </mushroom-shape-icon>
            <mushroom-state-info
              slot="info"
              .primary=${name}
              .secondary=${stateDisplay}
            ></mushroom-state-info>
          </mushroom-state-item>
          <div class="actions" ?rtl=${rtl}>
            ${this.renderDeviceControls(updateConfig)}
          </div>
        </mushroom-card>
      </ha-card>
    `;
  }
  private renderDeviceControls(
    updateConfig: UpdateConfig
  ): TemplateResult | typeof nothing {
    if (!this._config || !showDeviceControls(this._config)) {
      return nothing;
    }

    return html`
      <mushroom-device-card-controls
        .hass=${this.hass}
        .device=${this.device}
        .updateConfig=${updateConfig}
      >
      </mushroom-device-card-controls>
    `;
  }

  private _handleAnnounce(): void {
    if (!this.hass || !this.isAdmin()) {
      return;
    }

    const topic = this.device?.identifiers
      ?.map((id) => id[1])
      ?.find((id) => id.search(/_announce_/) > 0)
      ?.replace(/^.*_announce_/, "");

    if (topic) {
      this.hass.callService("mqtt", "publish", {
        topic: topic,
        payload: "announce",
      });
    }
  }
}
