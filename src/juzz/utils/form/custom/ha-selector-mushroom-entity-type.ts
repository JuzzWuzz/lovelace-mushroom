import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { fireEvent, HomeAssistant } from "../../../../ha";
import "../../../shared/editor/entity-type-picker";

export type MushEntityTypeSelector = {
  mush_entity_type: {};
};

@customElement("ha-selector-mush_entity_type")
export class HaMushEntityTypeSelector extends LitElement {
  @property() public hass!: HomeAssistant;

  @property() public selector!: MushEntityTypeSelector;

  @property() public value?: string;

  @property() public label?: string;

  protected render() {
    return html`
      <mushroom-entity-type-picker
        .hass=${this.hass}
        .label=${this.label}
        .value=${this.value}
        @value-changed=${this._valueChanged}
      ></mushroom-entity-type-picker>
    `;
  }

  private _valueChanged(ev: CustomEvent) {
    fireEvent(this, "value-changed", { value: ev.detail.value || undefined });
  }
}
