import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

export const ROW_TYPES = ["primary", "secondary", "none"] as const;
export type RowType = (typeof ROW_TYPES)[number];

const ALIGNMENT = ["start", "center", "end", "justify"] as const;
type Alignment = (typeof ALIGNMENT)[number];

@customElement("mushroom-row-container")
export class RowContainer extends LitElement {
  @property({ attribute: false }) public rowType: RowType = "none";
  @property({ attribute: false }) public alignment: Alignment = "start";
  @property({ type: Boolean }) public noWrap: boolean = true;
  @property({ type: Boolean }) public tightSpacing: boolean = false;
  @property({ type: Boolean }) public evenlyDistribute: boolean = false;

  protected render(): TemplateResult {
    let alignment = `align-${this.alignment}`;

    return html`
      <div
        class=${classMap({
          container: true,
          [alignment]: true,
          noWrap: this.noWrap,
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
        align-items: center;
        row-gap: var(--chip-spacing);
        flex-wrap: wrap;
      }
      .container.noWrap {
        flex-wrap: initial;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE 10+ */
      }
      .container.noWrap::-webkit-scrollbar {
        background: transparent; /* Chrome/Safari/Webkit */
        height: 0px;
      }
      .align-start {
        justify-content: flex-start;
      }
      .align-end {
        justify-content: flex-end;
      }
      .align-center {
        justify-content: center;
      }
      .align-justify {
        justify-content: space-between;
      }
      .primary {
        white-space: nowrap;
        font-weight: var(--card-primary-font-weight);
        font-size: var(--card-primary-font-size);
        line-height: var(--card-primary-line-height);
        color: var(--primary-text-color);
        --mdc-icon-size: var(--card-primary-line-height);
      }
      .secondary {
        white-space: nowrap;
        font-weight: var(--card-secondary-font-weight);
        font-size: var(--card-secondary-font-size);
        line-height: var(--card-secondary-line-height);
        color: var(--secondary-text-color);
        --mdc-icon-size: var(--card-secondary-line-height);
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
