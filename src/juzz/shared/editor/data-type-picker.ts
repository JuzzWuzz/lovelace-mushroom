import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { DATA_TYPES, DataType } from "../../utils/types";

@customElement("mushroom-data-type-picker")
export class DataTypePicker extends LitElement {
  @property() public label = "";

  @property() public value?: string;

  @property() public configValue = "";

  @property() public dataTypes?: DataType[];

  _selectChanged(ev) {
    const value = ev.target.value;
    if (value) {
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          detail: {
            value: value !== "auto" ? value : "",
          },
        })
      );
    }
  }

  render() {
    return html`
      <mushroom-select
        .label=${this.label}
        .configValue=${this.configValue}
        @selected=${this._selectChanged}
        @closed=${(e) => e.stopPropagation()}
        .value=${this.value || "auto"}
        fixedMenuPosition
        naturalMenuWidth
      >
        <mwc-list-item value="auto"> Auto Detect </mwc-list-item>
        ${(this.dataTypes ?? DATA_TYPES).map((info) => {
          return html`
            <mwc-list-item .value=${info}>
              ${capitalizeWords(info)}
            </mwc-list-item>
          `;
        })}
      </mushroom-select>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      mushroom-select {
        width: 100%;
      }
    `;
  }
}

function capitalizeWords(string: string) {
  return string
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
