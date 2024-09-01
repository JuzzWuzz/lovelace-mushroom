import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { fireEvent, HomeAssistant } from "../../../../ha";
import "../../../shared/editor/data-type-picker";

export type MushDataTypeSelector = {
  mush_data_type: {};
};

@customElement("ha-selector-mush_data_type")
export class HaMushDataTypeSelector extends LitElement {
  @property() public hass!: HomeAssistant;

  @property() public selector!: MushDataTypeSelector;

  @property() public value?: string;

  @property() public label?: string;

  protected render() {
    return html`
      <mushroom-data-type-picker
        .hass=${this.hass}
        .label=${this.label}
        .value=${this.value}
        @value-changed=${this._valueChanged}
      ></mushroom-data-type-picker>
    `;
  }

  private _valueChanged(ev: CustomEvent) {
    fireEvent(this, "value-changed", { value: ev.detail.value || undefined });
  }
}
