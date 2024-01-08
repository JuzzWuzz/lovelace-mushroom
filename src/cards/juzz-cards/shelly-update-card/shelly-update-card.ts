import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, nothing, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
    computeRTL,
    DeviceRegistryEntry,
    fireEvent,
    HomeAssistant,
    LovelaceCard,
    LovelaceCardEditor,
    ON,
    UNAVAILABLE,
    UNKNOWN,
} from "../../../ha";
// import "../../../shared/badge-icon";
// import "../../../shared/card";
// import "../../../shared/shape-avatar";
// import "../../../shared/shape-icon";
// import "../../../shared/state-info";
// import "../../../shared/state-item";
import { MushroomBaseCard } from "../../../utils/base-card";
import { cardStyle } from "../../../utils/card-styles";
import { computeRgbColor } from "../../../utils/colors";
import { registerCustomCard } from "../../../utils/custom-cards";
import { UPDATE_DOMAINS, SHELLY_UPDATE_CARD_EDITOR_NAME, SHELLY_UPDATE_CARD_NAME } from "./const";
import {
    SHELLY_UPDATE_CARD_DEFAULT_USE_DEVICE_NAME,
    ShellyUpdateCardConfig,
    ShellyUpdateCardConfigStrict,
} from "./shelly-update-card-config";
import { Appearance } from "../../../shared/config/appearance-config";

registerCustomCard({
    type: SHELLY_UPDATE_CARD_NAME,
    name: "Mushroom Shelly Update Card",
    description:
        "Card for Shelly devices that can track firmware updates and trigger announcements",
});

@customElement(SHELLY_UPDATE_CARD_NAME)
export class ShellyUpdateCard extends MushroomBaseCard implements LovelaceCard {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        await import("./shelly-update-card-editor");
        return document.createElement(SHELLY_UPDATE_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<ShellyUpdateCardConfig> {
        const entities = Object.keys(hass.states);
        const updateEntities = entities.filter((e) => UPDATE_DOMAINS.includes(e.split(".")[0]));
        return {
            type: `custom:${SHELLY_UPDATE_CARD_NAME}`,
            entity: updateEntities[0],
            use_device_name: true,
        };
    }

    @state() private _config?: ShellyUpdateCardConfigStrict;
    private _entityId?: string;
    private _device?: DeviceRegistryEntry;

    getCardSize(): number | Promise<number> {
        return 1;
    }

    setConfig(config: ShellyUpdateCardConfig): void {
        this._config = {
            use_device_name: SHELLY_UPDATE_CARD_DEFAULT_USE_DEVICE_NAME,
            ...config,
        };

        this._entityId = this._config.entity;
    }

    private _handleAnnounce(): void {
        if (!this._entityId || !this.hass) {
            return;
        }

        const topic = this.getDevice(this._entityId)
            ?.identifiers?.map((id) => id[1])
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
        if (!this._entityId || !this.hass) {
            return;
        }

        this.hass.callService("update", "install", {
            entity_id: this._entityId,
        });
    }

    private _handleDeviceInfo(): void {
        if (!this._entityId || !this.hass) return;

        const device = this.getDevice(this._entityId);
        if (device) {
            fireEvent(this, "hass-action", {
                config: {
                    tap_action: {
                        action: "navigate",
                        navigation_path: `/config/devices/device/${device.id}`,
                    },
                },
                action: "tap",
            });
        }
    }

    protected render() {
        if (!this._config || !this.hass || !this._entityId) {
            return nothing;
        }

        const stateObj = this.hass.states[this._entityId] as HassEntity | undefined;

        if (!stateObj) {
            return this.renderNotFound(this._config);
        }

        // Parse the entity for some fields
        const hasState = ![UNAVAILABLE, UNKNOWN].includes(stateObj.state);
        const hasUpdate = stateObj.state === ON;
        const installedVersion = stateObj.attributes?.installed_version;
        const latestVersion = stateObj.attributes?.latest_version;
        const installProgress = stateObj.attributes?.in_progress;
        const installing = typeof installProgress === "number" || installProgress === true;

        const name =
            this._config.name ||
            this.getDeviceName(this._entityId, this._config.use_device_name) ||
            stateObj.attributes.friendly_name ||
            "";
        let icon = "mdi:cloud-check-outline";
        let iconColor = "var(--rgb-state-update-off)";
        let stateDisplay = ["Up to date", installedVersion]
            .filter((s) => (s ?? null) !== null)
            .join(": ");
        if (!hasState) {
            icon = "mdi:cloud-off-outline";
            iconColor = "disabled";
            stateDisplay = "Device offline";
        } else if (hasUpdate) {
            const versionMapping = [installedVersion, latestVersion]
                .filter((s) => (s ?? null) !== null)
                .join(" → ");

            icon = "mdi:cloud-download-outline";
            iconColor = "var(--rgb-state-update-on)";
            stateDisplay = ["Update available", versionMapping]
                .filter((s) => (s ?? null) !== null)
                .join(": ");

            if (installing) {
                iconColor = "var(--rgb-state-update-installing)";
                if (typeof installProgress === "number") {
                    stateDisplay = `Installing ${installProgress}%`;
                } else if (installProgress === true) {
                    stateDisplay = "Installing";
                }
            }
        }

        const iconStyle = {};
        const iconRgbColor = computeRgbColor(iconColor);
        iconStyle["--icon-color"] = `rgb(${iconRgbColor})`;
        iconStyle["--shape-color"] = `rgba(${iconRgbColor}, 0.2)`;

        const appearance: Appearance = {
            layout: "horizontal",
            fill_container: false,
            primary_info: "name",
            secondary_info: "state",
            icon_type: "icon",
        };

        const rtl = computeRTL(this.hass);

        return html`
            <ha-card class=${classMap({ "fill-container": appearance.fill_container })}>
                <mushroom-card ?rtl=${rtl} .appearance=${appearance}>
                    <mushroom-state-item ?rtl=${rtl} .appearance=${appearance}>
                        <mushroom-shape-icon
                            slot="icon"
                            style=${styleMap(iconStyle)}
                            class=${classMap({
                                pulse: installing,
                            })}
                        >
                            <ha-icon icon=${icon}></ha-icon>
                        </mushroom-shape-icon>
                        <mushroom-state-info
                            slot="info"
                            .primary=${name}
                            .secondary=${stateDisplay}
                            .multiline_secondary=${true}
                        ></mushroom-state-info>
                    </mushroom-state-item>
                    ${this.renderControls(rtl, hasState, hasUpdate, installing)}
                </mushroom-card>
            </ha-card>
        `;
    }

    private renderControls(
        rtl: boolean,
        available: boolean,
        hasUpdate: boolean,
        installing: boolean
    ): TemplateResult | typeof nothing {
        if (this.hass.user?.is_admin !== true) return nothing;

        const iconStyle = {
            "--bg-color": "rgba(var(--rgb-disabled), 0.1)",
            "--bg-color-disabled": "rgba(var(--rgb-disabled), 0.1)",
        };
        return html`
            <mushroom-button-group ?rtl=${rtl} class="controls">
                ${hasUpdate && available
                    ? html`
                          <mushroom-button
                              icon="mdi:cellphone-arrow-down"
                              .disabled=${installing}
                              @click=${this._handleInstall}
                              style=${styleMap(iconStyle)}
                          ></mushroom-button>
                      `
                    : nothing}
                <mushroom-button
                    icon="mdi:bullhorn-outline"
                    .disabled=${installing}
                    @click=${this._handleAnnounce}
                    style=${styleMap(iconStyle)}
                ></mushroom-button>
                <mushroom-button
                    icon="mdi:cog-outline"
                    @click=${this._handleDeviceInfo}
                    style=${styleMap(iconStyle)}
                ></mushroom-button>
            </mushroom-button-group>
        `;
    }

    static get styles(): CSSResultGroup {
        return [
            super.styles,
            cardStyle,
            css`
                mushroom-state-item {
                    flex: 1 1 auto;
                }
                mushroom-shape-icon {
                    --icon-color: rgb(var(--rgb-state-entity));
                    --shape-color: rgba(var(--rgb-state-entity), 0.2);
                }
                mushroom-shape-icon.pulse {
                    --shape-animation: 1s ease 0s infinite normal none running pulse;
                }
                mushroom-button-group {
                    flex: 0 1 auto;
                    flex-basis: fit-content;
                    min-width: auto;
                }
                mushroom-button-group > mushroom-button {
                    flex: 0 1 auto;
                    width: calc(var(--control-height) * var(--control-button-ratio));
                }
            `,
        ];
    }

    private getDevice(entityId: string): DeviceRegistryEntry | undefined {
        if (!this._device && this.hass) {
            const deviceId = this.hass.entities[entityId]?.device_id;
            if (deviceId) {
                this._device = this.hass.devices[deviceId];
            }
        }

        return this._device;
    }

    private getDeviceName(entityId: string, useDeviceName: boolean): string | undefined {
        let deviceName: string | undefined;
        if (useDeviceName) {
            deviceName = this.getDevice(entityId)?.name ?? deviceName;
        }
        return deviceName;
    }
}
