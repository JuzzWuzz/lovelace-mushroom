import { css, html, CSSResultGroup, LitElement, TemplateResult, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { computeRTL, fireEvent, DeviceRegistryEntry, HomeAssistant } from "../../../ha";

@customElement("mushroom-device-card-controls")
export class DeviceCardControls extends LitElement {
    @property({ attribute: false }) public hass!: HomeAssistant;

    @property({ attribute: false }) public device?: DeviceRegistryEntry;

    @property({ type: Boolean }) public fill: boolean = false;

    @property({ attribute: false }) public additionalControls: TemplateResult | typeof nothing =
        nothing;

    protected navigateToDeviceInfoPage(): void {
        if (!this.device) return;

        fireEvent(this, "hass-action", {
            config: {
                tap_action: {
                    action: "navigate",
                    navigation_path: `/config/devices/device/${this.device.id}`,
                },
            },
            action: "tap",
        });
    }

    protected render(): TemplateResult {
        const rtl = computeRTL(this.hass);

        return html`
            <mushroom-button-group .fill=${this.fill} ?rtl=${rtl}>
                ${this.additionalControls}
                <mushroom-button @click=${this.navigateToDeviceInfoPage}>
                    <ha-icon .icon=${"mdi:cog-outline"}></ha-icon>
                </mushroom-button>
            </mushroom-button-group>
        `;
    }

    static get styles(): CSSResultGroup {
        return css`
            mushroom-button-group {
                width: fit-content;
            }
            mushroom-button-group > mushroom-button {
                width: calc(var(--control-height) * var(--control-button-ratio));
                --bg-color: rgba(var(--rgb-disabled), 0.1);
                --bg-color-disabled: rgba(var(--rgb-disabled), 0.1);
            }
        `;
    }
}
