import { HassEntity } from "home-assistant-js-websocket";
import { css, html, nothing, CSSResultGroup, TemplateResult } from "lit";
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
import "../../../shared/badge-icon";
import "../../../shared/card";
import "../../../shared/shape-avatar";
import "../../../shared/shape-icon";
import "../../../shared/state-info";
import "../../../shared/state-item";
import { EntityType, MushroomBaseDeviceCard } from "../../utils/base-device-card";
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
import { Appearance } from "../../../shared/config/appearance-config";

registerCustomCard({
    type: ZIGBEE2MQTT_CARD_NAME,
    name: "Mushroom Zigbee2MQTT Card",
    description:
        "Card for Zigbee2MQTT devices like Contact, Climate, and Motion sensors. Shows the primary and related entity states",
});

@customElement(ZIGBEE2MQTT_CARD_NAME)
export class Zigbee2MQTTCard
    extends MushroomBaseDeviceCard<Zigbee2MQTTCardConfig>
    implements LovelaceCard
{
    // Override default value
    protected useDeviceNameDefault: boolean = ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME;

    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        await import("./zigbee2mqtt-card-editor");
        return document.createElement(ZIGBEE2MQTT_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<Zigbee2MQTTCardConfig> {
        const entities = Object.keys(hass.states);
        const updateEntities = entities.filter((e) =>
            ZIGBEE2MQTT_CARD_DOMAINS.includes(e.split(".")[0])
        );
        return {
            type: `custom:${ZIGBEE2MQTT_CARD_NAME}`,
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

        // Determine the Entity Type
        const entityType = this._config.entity_type ?? this.computeEntityType(stateObj);

        // Parse the entity for some fields
        const deviceOffline = [UNAVAILABLE, UNKNOWN].includes(stateObj.state);

        // Get the related entities (To add in their values on the screen)
        let relatedEntities: HassEntity[] = this.getDeviceEntities(entityType);
        const batteryEntity = relatedEntities.find((e) => e.entity_id.endsWith("battery"));
        const lastSeenEntity = relatedEntities.find((e) => e.entity_id.endsWith("last_seen"));
        relatedEntities = relatedEntities.filter(
            (e) => e !== batteryEntity && e !== lastSeenEntity
        );

        const name =
            this._config.name || this.getDeviceName() || stateObj.attributes.friendly_name || "";
        const stateDisplay = deviceOffline ? "Device offline" : this.getStateDisply(stateObj);

        const iconStyle = {};
        const iconColor = this.getIconColor(entityType, this._config.icon_color);
        if (iconColor) {
            const iconRgbColor = computeRgbColor(iconColor);
            iconStyle["--icon-color"] = `rgb(${iconRgbColor})`;
            iconStyle["--shape-color"] = `rgba(${iconRgbColor}, 0.2)`;
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
            <ha-card class=${classMap({ "fill-container": appearance.fill_container })}>
                <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
                    <mushroom-state-item .appearance=${appearance} ?rtl=${rtl}>
                        <mushroom-shape-icon
                            slot="icon"
                            .disabled=${deviceOffline}
                            style=${styleMap(iconStyle)}
                        >
                            <ha-state-icon .hass=${this.hass} .stateObj=${stateObj}></ha-state-icon>
                        </mushroom-shape-icon>
                        <div slot="info">
                            <mushroom-row-container .rowType=${"primary"}>
                                <span>${name}</span>
                                <div class="spacer"></div>
                                ${this.renderPowerState(deviceOffline, batteryEntity)}
                            </mushroom-row-container>
                            <mushroom-row-container .rowType=${"secondary"} .tightSpacing=${true}>
                                <span>${stateDisplay}</span>
                                <div class="spacer"></div>
                                ${this._config.layout === "horizontal"
                                    ? this.renderRelatedEntities(deviceOffline, relatedEntities)
                                    : nothing}
                                ${this.renderLastSeen(deviceOffline, lastSeenEntity?.state)}
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
                                      ${this.renderRelatedEntities(deviceOffline, relatedEntities)}
                                  </mushroom-row-container>
                                  ${this.renderDeviceControls()}
                              `}
                    </div>
                </mushroom-card>
            </ha-card>
        `;
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
        batteryEntity?: HassEntity
    ): TemplateResult | typeof nothing {
        if (!this._config || !showPowerStatus(this._config) || deviceOffline) {
            return nothing;
        }

        return batteryEntity
            ? html`<ha-state-icon .hass=${this.hass} .stateObj=${batteryEntity}></ha-state-icon>`
            : html`<ha-icon icon="mdi:power-plug"></ha-icon>`;
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
                        <span>${this.getStateDisply(e)}</span>
                    </mushroom-inline-state-item>
                `
            )}
        `;
    }

    private renderLastSeen(
        deviceOffline: boolean,
        lastSeen?: string
    ): TemplateResult | typeof nothing {
        if (!this._config || !showLastSeen(this._config) || (deviceOffline && !lastSeen)) {
            return nothing;
        }

        return html`
            <mushroom-inline-state-item .hass=${this.hass}>
                <ha-relative-time
                    .hass=${this.hass}
                    .datetime=${lastSeen}
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
