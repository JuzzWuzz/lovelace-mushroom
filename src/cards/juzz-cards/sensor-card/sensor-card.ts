import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, nothing, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
    computeRTL,
    computeStateDisplay,
    DeviceRegistryEntry,
    fireEvent,
    HomeAssistant,
    LovelaceCard,
    LovelaceCardEditor,
    UNAVAILABLE,
    UNKNOWN,
} from "../../../ha";
import "../../../shared/badge-icon";
import "../../../shared/card";
import "../../../shared/shape-avatar";
import "../../../shared/shape-icon";
import "../../../shared/state-info";
import "../../../shared/state-item";
import { MushroomBaseCard } from "../../../utils/base-card";
import { cardStyle } from "../../../utils/card-styles";
import { computeRgbColor } from "../../../utils/colors";
import { registerCustomCard } from "../../../utils/custom-cards";
import { SENSOR_CARD_DOMAINS, SENSOR_CARD_EDITOR_NAME, SENSOR_CARD_NAME } from "./const";
import {
    SENSOR_CARD_DEFAULT_SHOW_LAST_SEEN,
    SENSOR_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES,
    SENSOR_CARD_DEFAULT_USE_DEVICE_NAME,
    SENSOR_CARD_SHOW_POWER_STATUS,
    SensorCardConfig,
    SensorCardConfigStrict,
} from "./sensor-card-config";
import { Appearance } from "../../../shared/config/appearance-config";

registerCustomCard({
    type: SENSOR_CARD_NAME,
    name: "Mushroom Sensor Card",
    description:
        "Card for Sensors like Contact, Motion, and Temperature which shows its state and related device entities",
});

@customElement(SENSOR_CARD_NAME)
export class SensorCard extends MushroomBaseCard implements LovelaceCard {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        await import("./sensor-card-editor");
        return document.createElement(SENSOR_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<SensorCardConfig> {
        const entities = Object.keys(hass.states);
        const updateEntities = entities.filter((e) =>
            SENSOR_CARD_DOMAINS.includes(e.split(".")[0])
        );
        return {
            type: `custom:${SENSOR_CARD_NAME}`,
            entity: updateEntities[0],
            use_device_name: true,
        };
    }

    @state() private _config?: SensorCardConfigStrict;
    private _entityId?: string;
    private _device?: DeviceRegistryEntry;

    getCardSize(): number | Promise<number> {
        return 1;
    }

    setConfig(config: SensorCardConfig): void {
        this._config = {
            use_device_name: SENSOR_CARD_DEFAULT_USE_DEVICE_NAME,
            show_other_device_entities: SENSOR_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES,
            show_power_status: SENSOR_CARD_SHOW_POWER_STATUS,
            show_last_seen: SENSOR_CARD_DEFAULT_SHOW_LAST_SEEN,
            ...config,
        };

        this._entityId = this._config.entity;
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

        // Get the related entities (To add in their values on the screen)
        let relatedEntities: HassEntity[] = hasState ? this.getDeviceEntities(stateObj) : [];
        const batteryEntity = relatedEntities.find((e) => e.attributes.device_class === "battery");
        const lastSeenEntity = relatedEntities.find(
            (e) => e.attributes.device_class === "timestamp"
        );
        relatedEntities = relatedEntities.filter(
            (e) => e !== batteryEntity && e !== lastSeenEntity
        );

        const name =
            this._config.name ||
            this.getDeviceName(this._entityId, this._config.use_device_name) ||
            stateObj.attributes.friendly_name ||
            "";
        const iconColor = hasState ? this._config.icon_color : "disabled";

        const iconStyle = {};
        if (iconColor) {
            const iconRgbColor = computeRgbColor(iconColor);
            iconStyle["--icon-color"] = `rgb(${iconRgbColor})`;
            iconStyle["--shape-color"] = `rgba(${iconRgbColor}, 0.2)`;
        }

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
                <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
                    <mushroom-state-item ?rtl=${rtl} .appearance=${appearance}>
                        <mushroom-shape-icon slot="icon" style=${styleMap(iconStyle)}>
                            <ha-state-icon .state=${stateObj}></ha-state-icon>
                        </mushroom-shape-icon>
                        <div slot="info">
                            <div class="row primary" ?rtl=${rtl}>
                                <div>${name}</div>
                                ${this.renderPowerState(batteryEntity)}
                            </div>
                            <div class="row secondary" ?rtl=${rtl}>
                                <div class="rowItem">
                                    <span
                                        >${hasState
                                            ? this.getStateDisply(stateObj)
                                            : "Device offline"}</span
                                    >
                                </div>
                                <div class="spacer"></div>
                                ${this.renderRelatedEntities(relatedEntities)}
                                ${this.renderLastSeen(lastSeenEntity?.state)}
                            </div>
                        </div>
                    </mushroom-state-item>
                    ${this.renderControls(rtl)}
                </mushroom-card>
            </ha-card>
        `;
    }

    private getStateDisply(stateObj: HassEntity) {
        return this.hass.formatEntityState
            ? this.hass.formatEntityState(stateObj)
            : computeStateDisplay(
                  this.hass.localize,
                  stateObj,
                  this.hass.locale,
                  this.hass.config,
                  this.hass.entities
              );
    }

    private renderPowerState(batteryEntity?: HassEntity): TemplateResult | typeof nothing {
        if (!this._config || !this._config.show_power_status) return nothing;

        return html`
            <div class="spacer"></div>
            <div class="rowItem">
                ${batteryEntity
                    ? html` <ha-state-icon .state=${batteryEntity}></ha-state-icon>`
                    : html` <ha-icon icon="mdi:power-plug"></ha-icon> `}
            </div>
        `;
    }

    private renderRelatedEntities(relatedEntities: HassEntity[]): TemplateResult | typeof nothing {
        if (!this._config || !this._config.show_other_device_entities) return nothing;

        return html` ${relatedEntities.map(
            (e) => html`
                <div class="rowItem">
                    <ha-state-icon slot="icon" .state=${e}></ha-state-icon>
                    <span>${this.getStateDisply(e)}</span>
                </div>
            `
        )}`;
    }

    private renderLastSeen(lastSeen?: string): TemplateResult | typeof nothing {
        if (!this._config || !this._config.show_last_seen) return nothing;

        return html`
            <div class="rowItem">
                <ha-relative-time
                    .hass=${this.hass}
                    .datetime=${lastSeen}
                    capitalize
                ></ha-relative-time>
            </div>
        `;
    }

    private renderControls(rtl: boolean): TemplateResult | typeof nothing {
        if (this.hass.user?.is_admin !== true) return nothing;

        const iconStyle = {
            "--bg-color": "rgba(var(--rgb-disabled), 0.1)",
            "--bg-color-disabled": "rgba(var(--rgb-disabled), 0.1)",
        };
        return html`
            <mushroom-button-group ?rtl=${rtl} class="controls">
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
                .container {
                    min-width: 0;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .primary {
                    font-weight: var(--card-primary-font-weight);
                    font-size: var(--card-primary-font-size);
                    line-height: var(--card-primary-line-height);
                    color: var(--primary-text-color);
                    --mdc-icon-size: calc(
                        (var(--card-primary-font-size) * var(--card-primary-line-height))
                    );
                }
                .secondary {
                    font-weight: var(--card-secondary-font-weight);
                    font-size: var(--card-secondary-font-size);
                    line-height: var(--card-secondary-line-height);
                    color: var(--secondary-text-color);
                    --mdc-icon-size: calc(
                        var(--card-secondary-font-size) * var(--card-secondary-line-height)
                    );
                }
                .row {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .rowItem {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                }
                .rowItem > ha-state-icon {
                    display: flex;
                    line-height: 0;
                    color: var(--icon-color);
                }
                .rowItem > span {
                    display: flex;
                }
                .rowItem:not(:last-child) {
                    margin-right: var(--chip-spacing);
                }
                [rtl] * > .rowItem:not(:last-child) {
                    margin-right: initial;
                    margin-left: var(--chip-spacing);
                }
                .spacer {
                    flex-grow: 1;
                }
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

    private getDeviceEntities(mainEntity: HassEntity): HassEntity[] {
        const deviceId = this.hass.entities[mainEntity.entity_id]?.device_id;

        if (!deviceId) return [];

        // These are the groups to search 'device_class' based on
        const validRelatedGroupings = [
            ["door", "window"], // Contact Sensor Types
            ["temperature", "humidity", "atmospheric_pressure"], // Temperature Sensor Types
            ["motion", "illuminance"], // Motion Sensor Types
        ];

        return Object.values(this.hass.entities)
            .filter((entity) => {
                const state = this.hass.states[entity.entity_id];

                return (
                    entity.device_id === deviceId &&
                    entity.entity_id !== mainEntity.entity_id &&
                    state &&
                    ((state.attributes.device_class === "timestamp" &&
                        (state.attributes.friendly_name ?? "").includes("Last seen")) ||
                        state.attributes.device_class === "battery" ||
                        validRelatedGroupings.some(
                            (group) =>
                                group.includes(state.attributes.device_class ?? "") &&
                                group.includes(mainEntity.attributes.device_class ?? "")
                        ))
                );
            })
            .map((entity) => this.hass.states[entity.entity_id]);
    }
}
