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
import { Appearance } from "../../../shared/config/appearance-config";

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
        return document.createElement(SHELLY_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<ShellyCardConfig> {
        const entities = Object.keys(hass.states);
        const updateEntities = entities.filter((e) => UPDATE_DOMAINS.includes(e.split(".")[0]));
        return {
            type: `custom:${SHELLY_CARD_NAME}`,
            entity: updateEntities[0],
        };
    }

    protected get hasControls(): boolean {
        return true;
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
        const hasUpdate = stateObj.state === ON;
        const installedVersion = stateObj.attributes?.installed_version;
        const latestVersion = stateObj.attributes?.latest_version;
        const installProgress = stateObj.attributes?.in_progress;
        const installing = typeof installProgress === "number" || installProgress === true;

        const name =
            this._config.name || this.getDeviceName() || stateObj.attributes.friendly_name || "";

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

        const rtl = computeRTL(this.hass);
        const appearance: Appearance = {
            layout: this._config.layout ?? "default",
            fill_container: this._config.fill_container ?? false,
            primary_info: "name",
            secondary_info: "state",
            icon_type: "icon",
        };

        return html`
            <ha-card class=${classMap({ "fill-container": appearance.fill_container })}>
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
                        ${this.renderDeviceControls(deviceOffline, hasUpdate, installing)}
                    </div>
                </mushroom-card>
            </ha-card>
        `;
    }
    private renderDeviceControls(
        deviceOffline: boolean,
        hasUpdate: boolean,
        installing: boolean
    ): TemplateResult | typeof nothing {
        if (!this._config || !showDeviceControls(this._config)) {
            return nothing;
        }

        return html`
            <mushroom-device-card-controls
                .hass=${this.hass}
                .device=${this.device}
                .additionalControls=${hasUpdate && !deviceOffline && this.isAdmin()
                    ? html`
                          <mushroom-button .disabled=${installing} @click=${this._handleInstall}>
                              <ha-icon .icon=${"mdi:cellphone-arrow-down"}></ha-icon>
                          </mushroom-button>
                      `
                    : nothing}
            ></mushroom-device-card-controls>
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

    private _handleInstall(): void {
        if (!this.hass || !this._config?.entity || !this.isAdmin()) {
            return;
        }

        this.hass.callService("update", "install", {
            entity_id: this._config.entity,
        });
    }
}
