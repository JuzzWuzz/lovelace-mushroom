import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, nothing, PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
    ActionConfigParams,
    actionHandler,
    ActionHandlerEvent,
    computeRTL,
    handleAction,
    HomeAssistant,
    isActive,
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
import { MushroomBaseDeviceCard } from "../../utils/base-device-card";
import { registerCustomCard } from "../../../utils/custom-cards";
import { AIR_PURIFIER_CARD_EDITOR_NAME, AIR_PURIFIER_CARD_NAME, FAN_ENTITY_DOMAINS } from "./const";
import { AirPurifierCardConfig } from "./air-purifier-card-config";

registerCustomCard({
    type: AIR_PURIFIER_CARD_NAME,
    name: "Mushroom Air Purifier Card",
    description:
        "Card for air purifier to show air quality and other states along with controlling the fan",
});

@customElement(AIR_PURIFIER_CARD_NAME)
export class AirPurifierCard extends MushroomBaseDeviceCard implements LovelaceCard {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        await import("./air-purifier-card-editor");
        return document.createElement(AIR_PURIFIER_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<AirPurifierCardConfig> {
        const entities = Object.keys(hass.states);
        const fans = entities.filter((e) => FAN_ENTITY_DOMAINS.includes(e.split(".")[0]));
        return {
            type: `custom:${AIR_PURIFIER_CARD_NAME}`,
            entity: fans[0],
        };
    }

    @state() private _config?: AirPurifierCardConfig;

    getCardSize(): number | Promise<number> {
        return 1;
    }

    setConfig(config: AirPurifierCardConfig): void {
        this._config = {
            ...config,
        };

        this._entityId = this._config.entity;
    }

    protected updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
        if (this.hass && changedProperties.has("hass")) {
        }
    }

    private _handleAction(ev: ActionHandlerEvent) {
        if (!this.hass) {
            return;
        }
        const x: ActionConfigParams = {
            entity: this._entityId,
            tap_action: {
                action: "toggle",
            },
            hold_action: {
                action: "more-info",
            },
        };
        handleAction(this, this.hass, x, ev.detail.action!);
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
        const deviceOnline = ![UNAVAILABLE, UNKNOWN].includes(stateObj.state);

        // Get the related entities (To add in their values on the screen)
        let relatedEntities: HassEntity[] = this.getDeviceEntities("air_purifier");

        const name = this._config.name || stateObj.attributes.friendly_name || "";
        const icon = this._config.icon;
        let iconStyle = {};
        const active = isActive(stateObj);
        if (active) {
            iconStyle["--animation-duration"] = `1s`;
        }

        const rtl = computeRTL(this.hass);

        return html`
            <ha-card>
                <mushroom-card ?rtl=${rtl}>
                    <mushroom-row-container>
                        <mushroom-state-item ?rtl=${rtl}>
                            <mushroom-shape-icon
                                slot="icon"
                                class=${classMap({
                                    action: true,
                                    spin: active && Boolean(this._config?.icon_animation),
                                })}
                                style=${styleMap(iconStyle)}
                                .disabled=${!active}
                                @action=${this._handleAction}
                                .actionHandler=${actionHandler({
                                    hasHold: true,
                                    hasDoubleClick: false,
                                })}
                            >
                                <ha-state-icon
                                    .hass=${this.hass}
                                    .stateObj=${stateObj}
                                    .icon=${icon}
                                ></ha-state-icon>
                            </mushroom-shape-icon>
                            <div slot="info">
                                <mushroom-row-container .rowType=${"primary"}>
                                    <span>${name}</span>
                                </mushroom-row-container>
                                <mushroom-row-container .rowType=${"secondary"}>
                                    <span>
                                        ${deviceOnline
                                            ? this.getStateDisply(stateObj)
                                            : "Device offline"}
                                    </span>
                                </mushroom-row-container>
                            </div>
                        </mushroom-state-item>
                        ${this.renderControls(rtl)}
                    </mushroom-row-container>
                    <mushroom-row-container .evenlyDistribute=${true}>
                        ${relatedEntities.map(
                            (e) => html`
                                <mushroom-inline-state-item .hass=${this.hass} .state=${e}>
                                    <span class="state">${this.getStateDisply(e)}</span>
                                </mushroom-inline-state-item>
                            `
                        )}
                    </mushroom-row-container>
                </mushroom-card>
            </ha-card>
        `;
    }

    static get styles(): CSSResultGroup {
        return [
            super.styles,
            css`
                .state {
                    font-weight: var(--card-secondary-font-weight);
                    color: var(--secondary-text-color);
                }
            `,
        ];
    }
}
