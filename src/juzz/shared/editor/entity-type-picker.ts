import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { EntityType, ENTITY_TYPES } from "../../utils/base-device-card";

@customElement("mushroom-entity-type-picker")
export class EntityTypePicker extends LitElement {
  @property() public label = "";

  @property() public value?: string;

  @property() public configValue = "";

  @property() public entityTypes?: EntityType[];

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
        ${(this.entityTypes ?? ENTITY_TYPES).map((info) => {
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
