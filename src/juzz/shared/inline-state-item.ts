import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { HomeAssistant } from "../../ha";

@customElement("mushroom-inline-state-item")
export class InlineStateItem extends LitElement {
    @property({ attribute: false }) public hass!: HomeAssistant;

    @property({ attribute: false }) public state?: HassEntity;

    @property() public icon?: string;

    @property({ type: Boolean }) public showIcon: boolean = true;

    protected render(): TemplateResult {
        return html`
            <div
                class=${classMap({
                    container: true,
                })}
            >
                ${this.renderIcon()}
                <slot></slot>
            </div>
        `;
    }

    protected renderIcon(): TemplateResult | typeof nothing {
        if (!this.showIcon || (!this.state && !this.icon)) return nothing;

        return html` <ha-state-icon
            .hass=${this.hass}
            .stateObj=${this.state}
            .icon=${this.icon}
        ></ha-state-icon>`;
    }

    static get styles(): CSSResultGroup {
        return css`
            .container {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                height: 100%;
            }
            .container > *:not(:last-child) {
                margin-right: 0.15em;
            }
            :host([rtl]) .container > *:not(:last-child) {
                margin-right: initial;
                margin-left: 0.15em;
            }
            .container > ha-state-icon {
                display: flex;
                line-height: 0;
                color: var(--icon-color);
            }
            .container > ::slotted(*) {
                display: flex;
            }
        `;
    }
}
