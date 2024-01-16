import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, nothing, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
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
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN,
    ZIGBEE2MQTT_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES,
    ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME,
    ZIGBEE2MQTT_CARD_DOMAINS,
    ZIGBEE2MQTT_CARD_EDITOR_NAME,
    ZIGBEE2MQTT_CARD_NAME,
    ZIGBEE2MQTT_CARD_SHOW_POWER_STATUS,
} from "./const";
import { Zigbee2MQTTCardConfig, Zigbee2MQTTCardConfigStrict } from "./zigbee2mqtt-card-config";

registerCustomCard({
    type: ZIGBEE2MQTT_CARD_NAME,
    name: "Mushroom Zigbee2MQTT Card",
    description:
        "Card for Zigbee2MQTT devices like Contact, Climate, and Motion sensors. Shows the primary and related entity states",
});

@customElement(ZIGBEE2MQTT_CARD_NAME)
export class Zigbee2MQTTCard extends MushroomBaseDeviceCard implements LovelaceCard {
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
            use_device_name: true,
        };
    }

    @state() private _config?: Zigbee2MQTTCardConfigStrict;

    getCardSize(): number | Promise<number> {
        return 1;
    }

    setConfig(config: Zigbee2MQTTCardConfig): void {
        this._config = {
            use_device_name: ZIGBEE2MQTT_CARD_DEFAULT_USE_DEVICE_NAME,
            show_other_device_entities: ZIGBEE2MQTT_CARD_DEFAULT_SHOW_OTHER_DEVICE_ENTITIES,
            show_power_status: ZIGBEE2MQTT_CARD_SHOW_POWER_STATUS,
            show_last_seen: ZIGBEE2MQTT_CARD_DEFAULT_SHOW_LAST_SEEN,
            ...config,
        };

        this._entityId = this._config.entity;
    }

    protected render() {
        if (!this._config || !this.hass || !this._entityId) {
            return nothing;
        }

        const stateObj = this.hass.states[this._entityId] as HassEntity | undefined;
        if (!stateObj) {
            return this.renderNotFound(this._config);
        }

        // Determine the Entity Type
        const entityType = this._config.entity_type ?? this.computeEntityType(stateObj);

        // Parse the entity for some fields
        const deviceOnline = ![UNAVAILABLE, UNKNOWN].includes(stateObj.state);

        // Get the related entities (To add in their values on the screen)
        let relatedEntities: HassEntity[] = this.getDeviceEntities(entityType);
        const batteryEntity = relatedEntities.find((e) => e.entity_id.endsWith("battery"));
        const lastSeenEntity = relatedEntities.find((e) => e.entity_id.endsWith("last_seen"));
        relatedEntities = relatedEntities.filter(
            (e) => e !== batteryEntity && e !== lastSeenEntity
        );

        const name =
            this._config.name ||
            this.getDeviceName(this._config.use_device_name) ||
            stateObj.attributes.friendly_name ||
            "";

        const iconStyle = {};
        const iconColor = this.getIconColor(entityType, this._config.icon_color);
        if (iconColor) {
            const iconRgbColor = computeRgbColor(iconColor);
            iconStyle["--icon-color"] = `rgb(${iconRgbColor})`;
            iconStyle["--shape-color"] = `rgba(${iconRgbColor}, 0.2)`;
        }

        const rtl = computeRTL(this.hass);

        return html`
            <ha-card class=${classMap({ "fill-container": false })}>
                <mushroom-card ?rtl=${rtl}>
                    <mushroom-row-container>
                        <mushroom-state-item ?rtl=${rtl}>
                            <mushroom-shape-icon
                                slot="icon"
                                .disabled=${!deviceOnline}
                                style=${styleMap(iconStyle)}
                            >
                                <ha-state-icon .state=${stateObj}></ha-state-icon>
                            </mushroom-shape-icon>
                            <div slot="info">
                                <mushroom-row-container .rowType=${"primary"}>
                                    <span>${name}</span>
                                    <div class="spacer"></div>
                                    ${this.renderPowerState(deviceOnline, batteryEntity)}
                                </mushroom-row-container>
                                <mushroom-row-container
                                    .rowType=${"secondary"}
                                    .tightSpacing=${true}
                                >
                                    <span>
                                        ${deviceOnline
                                            ? this.getStateDisply(stateObj)
                                            : "Device offline"}
                                    </span>
                                    <div class="spacer"></div>
                                    ${this.renderRelatedEntities(deviceOnline, relatedEntities)}
                                    ${this.renderLastSeen(deviceOnline, lastSeenEntity?.state)}
                                </mushroom-row-container>
                            </div>
                        </mushroom-state-item>
                        ${this.renderControls(rtl)}
                    </mushroom-row-container>
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
        deviceOnline: boolean,
        batteryEntity?: HassEntity
    ): TemplateResult | typeof nothing {
        if (!this._config || !this._config.show_power_status || !deviceOnline) return nothing;

        return html`
            ${batteryEntity
                ? html` <ha-state-icon .state=${batteryEntity}></ha-state-icon>`
                : html` <ha-icon icon="mdi:power-plug"></ha-icon> `}
        `;
    }

    private renderRelatedEntities(
        deviceOnline: boolean,
        relatedEntities: HassEntity[]
    ): TemplateResult | typeof nothing {
        if (!this._config || !this._config.show_other_device_entities || !deviceOnline)
            return nothing;

        return html` ${relatedEntities.map(
            (e) => html`
                <mushroom-inline-state-item .state=${e}>
                    <span>${this.getStateDisply(e)}</span>
                </mushroom-inline-state-item>
            `
        )}`;
    }

    private renderLastSeen(
        deviceOnline: boolean,
        lastSeen?: string
    ): TemplateResult | typeof nothing {
        if (!this._config || !this._config.show_last_seen || (!deviceOnline && !lastSeen))
            return nothing;

        return html`
            <mushroom-inline-state-item>
                <ha-relative-time
                    .hass=${this.hass}
                    .datetime=${lastSeen}
                    capitalize
                ></ha-relative-time>
            </mushroom-inline-state-item>
        `;
    }

    static get styles(): CSSResultGroup {
        return [super.styles, css``];
    }
}
