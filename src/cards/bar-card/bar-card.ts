import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, nothing, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import {
    actionHandler,
    ActionHandlerEvent,
    computeRTL,
    computeStateDisplay,
    formatNumber,
    getDefaultFormatOptions,
    getNumberFormatOptions,
    handleAction,
    hasAction,
    HomeAssistant,
    isActive,
    isAvailable,
    LovelaceCard,
    LovelaceCardEditor,
} from "../../ha";
// import "../../shared/badge-icon";
// import "../../shared/button";
// import "../../shared/card";
// import "../../shared/shape-avatar";
// import "../../shared/shape-icon";
// import "../../shared/state-info";
// import "../../shared/state-item";
import "../../shared/slider-ex";
import { computeAppearance } from "../../utils/appearance";
import { MushroomBaseCard } from "../../utils/base-card";
import { cardStyle } from "../../utils/card-styles";
import { computeRgbColor } from "../../utils/colors";
import { registerCustomCard } from "../../utils/custom-cards";
import { stateIcon } from "../../utils/icons/state-icon";
import { computeEntityPicture } from "../../utils/info";
import { BAR_CARD_EDITOR_NAME, BAR_CARD_NAME, BAR_ENTITY_DOMAINS } from "./const";
import { BarCardConfig } from "./bar-card-config";

registerCustomCard({
    type: BAR_CARD_NAME,
    name: "Mushroom Bar Card",
    description: "Card for numeric entities to be represented as a bar gauge",
});

@customElement(BAR_CARD_NAME)
export class BarCard extends MushroomBaseCard implements LovelaceCard {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        await import("./bar-card-editor");
        return document.createElement(BAR_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<BarCardConfig> {
        const entities = Object.keys(hass.states).filter(
            (e) =>
                BAR_ENTITY_DOMAINS.includes(e.split(".")[0]) &&
                hass.states[e] &&
                !isNaN(Number(hass.states[e].state))
        );
        return {
            type: `custom:${BAR_CARD_NAME}`,
            entity: entities[0],
        };
    }

    @state() private _config?: BarCardConfig;

    getCardSize(): number | Promise<number> {
        return 1;
    }

    setConfig(config: BarCardConfig): void {
        this._config = {
            min: 0,
            max: 100,
            tap_action: {
                action: "more-info",
            },
            hold_action: {
                action: "more-info",
            },
            ...config,
        };
    }

    private _handleAction(ev: ActionHandlerEvent) {
        handleAction(this, this.hass!, this._config!, ev.detail.action!);
    }

    private computeSeverity(numberValue: number): string | undefined {
        return (
            this._config?.segments
                ?.filter((segment) => numberValue >= segment.from)
                ?.sort((a, b) => b.from - a.from)
                .shift()?.color ?? this._config?.icon_color
        );
    }

    protected render() {
        if (!this._config || !this.hass || !this._config.entity) {
            return nothing;
        }

        const entityId = this._config.entity;
        const stateObj = this.hass.states[entityId] as HassEntity | undefined;

        if (!stateObj) {
            return this.renderNotFound(this._config);
        }

        const name = this._config.name || stateObj.attributes.friendly_name || "";
        const icon = this._config.icon || stateIcon(stateObj);
        const appearance = computeAppearance(this._config);
        const picture = computeEntityPicture(stateObj, appearance.icon_type);

        let stateDisplay = computeStateDisplay(
            this.hass.localize,
            stateObj,
            this.hass.locale,
            this.hass.entities,
            this.hass.connection.haVersion
        );
        const numberValue = formatNumber(
            stateObj.state,
            this.hass.locale,
            getNumberFormatOptions(stateObj, this.hass.entities[stateObj.entity_id]) ??
                getDefaultFormatOptions(stateObj.state)
        );
        stateDisplay = `${numberValue} ${stateObj.attributes.unit_of_measurement ?? ""}`;

        const rtl = computeRTL(this.hass);

        const entityState = Number(stateObj.state);

        const sliderStyle = {};
        const sliderColor = this.computeSeverity(entityState);
        if (sliderColor) {
            const iconRgbColor = computeRgbColor(sliderColor);
            sliderStyle["--main-color"] = `rgb(${iconRgbColor})`;
            sliderStyle["--bg-color"] = `rgba(${iconRgbColor}, 0.2)`;
        }

        return html`
            <ha-card class=${classMap({ "fill-container": appearance.fill_container })}>
                <mushroom-card .appearance=${appearance} ?rtl=${rtl}>
                    <mushroom-state-item
                        ?rtl=${rtl}
                        .appearance=${appearance}
                        @action=${this._handleAction}
                        .actionHandler=${actionHandler({
                            hasHold: hasAction(this._config.hold_action),
                            hasDoubleClick: hasAction(this._config.double_tap_action),
                        })}
                    >
                        ${picture ? this.renderPicture(picture) : this.renderIcon(stateObj, icon)}
                        ${this.renderBadge(stateObj)}
                        ${this.renderStateInfo(stateObj, appearance, name, stateDisplay)};
                    </mushroom-state-item>
                    <mushroom-slider-ex
                        .value=${stateObj.state}
                        .controllable=${false}
                        .disabled=${!isAvailable(stateObj)}
                        .inactive=${!isActive(stateObj)}
                        .showActive=${true}
                        .min=${this._config.min}
                        .max=${this._config.max}
                        style=${styleMap(sliderStyle)}
                    />
                </mushroom-card>
            </ha-card>
        `;
    }

    renderIcon(stateObj: HassEntity, icon: string): TemplateResult {
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
                .icon=${icon}
                style=${styleMap(iconStyle)}
            ></mushroom-shape-icon>
        `;
    }

    static get styles(): CSSResultGroup {
        return [
            super.styles,
            cardStyle,
            css`
                mushroom-state-item {
                    cursor: pointer;
                }
                mushroom-shape-icon {
                    --icon-color: rgb(var(--rgb-state-number));
                    --shape-color: rgba(var(--rgb-state-number), 0.2);
                }
                mushroom-slider-ex {
                    --main-color: rgb(var(--rgb-state-number));
                    --bg-color: rgba(var(--rgb-state-number), 0.2);
                }
            `,
        ];
    }
}
