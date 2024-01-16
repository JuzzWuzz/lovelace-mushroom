import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

export const ROW_TYPES = ["primary", "secondary", "none"] as const;
export type RowType = (typeof ROW_TYPES)[number];

@customElement("mushroom-row-container")
export class RowContainer extends LitElement {
    @property({ attribute: false }) public rowType: RowType = "none";

    @property({ type: Boolean }) public tightSpacing: boolean = false;
    @property({ type: Boolean }) public evenlyDistribute: boolean = false;

    protected render(): TemplateResult {
        return html`
            <div
                class=${classMap({
                    container: true,
                    tightSpacing: this.tightSpacing,
                    primary: this.rowType === "primary",
                    secondary: this.rowType === "secondary",
                    evenlyDistribute: this.evenlyDistribute,
                })}
            >
                <slot></slot>
            </div>
        `;
    }

    static get styles(): CSSResultGroup {
        return css`
            .container {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                align-items: center;
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
            .container.evenlyDistribute > ::slotted(*),
            .container > ::slotted(.spacer) {
                flex-grow: 1;
            }
            .container > ::slotted(*:not(:last-child)) {
                margin-right: var(--spacing);
                margin-bottom: 0;
            }
            .container.tightSpacing > ::slotted(*:not(:last-child)) {
                margin-right: var(--chip-spacing);
            }
            :host([rtl]) .container > ::slotted(*:not(:last-child)) {
                margin-right: initial;
                margin-left: var(--spacing);
                margin-bottom: 0;
            }
            :host([rtl]) .container.tightSpacing > ::slotted(*:not(:last-child)) {
                margin-right: initial;
                margin-left: var(--chip-spacing);
            }
        `;
    }
}
