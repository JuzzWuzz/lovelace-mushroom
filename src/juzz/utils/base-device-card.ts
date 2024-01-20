import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, TemplateResult, html, nothing } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { DeviceRegistryEntry, computeStateDisplay, fireEvent } from "../../ha";
import "../shared/inline-state-item";
import "../shared/row-container";
import { MushroomBaseCard } from "../../utils/base-card";
import { cardStyle } from "../../utils/card-styles";

export const ENTITY_TYPES = ["air_purifier", "climate", "contact", "light", "motion"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export class MushroomBaseDeviceCard extends MushroomBaseCard {
    protected _entityId?: string;

    private _device?: DeviceRegistryEntry;
    get device(): DeviceRegistryEntry | undefined {
        if (!this._device && this._entityId && this.hass) {
            const deviceId = this.hass.entities[this._entityId]?.device_id;
            if (deviceId) {
                this._device = this.hass.devices[deviceId];
            }
        }

        return this._device;
    }

    protected getDeviceName(useDeviceName: boolean): string | undefined {
        return (useDeviceName ? this.device?.name : null) ?? undefined;
    }

    protected isAdmin(): boolean {
        return this.hass.user?.is_admin === true;
    }

    /**
     * Return the related device entities based on the type of entity
     */
    protected getDeviceEntities(
        entityType?: EntityType,
        configRelatedEntitiesSuffixes?: string[]
    ): HassEntity[] {
        const deviceId = this.device?.id;
        const entityId = this._entityId;

        if (!this.device || !entityId) return [];

        // Get the possible suffixes for related entity IDs
        const relatedEntitySuffixes =
            configRelatedEntitiesSuffixes ?? this.computeRelatedEntitySuffixes(entityType);

        return Object.values(this.hass.entities)
            .filter((entity) => {
                return (
                    entity.device_id === deviceId &&
                    entity.entity_id !== entityId &&
                    relatedEntitySuffixes.some((suffix) => entity.entity_id.endsWith(suffix)) &&
                    this.hass.states[entity.entity_id]
                );
            })
            .map((entity) => this.hass.states[entity.entity_id]);
    }

    protected getStateDisply(stateObj: HassEntity) {
        return this.hass.formatEntityState
            ? this.hass.formatEntityState(stateObj)
            : computeStateDisplay(
                  this.hass.localize,
                  stateObj,
                  this.hass.locale,
                  this.hass.config,
                  this.hass.entities
              );
    }

    /**
     * Try and determine the type of entity based on the domain and device class
     */
    protected computeEntityType(hassEntity: HassEntity): EntityType | undefined {
        const domain = hassEntity.entity_id.split(".")[0];
        const deviceClass = hassEntity.attributes.device_class;
        switch (domain) {
            case "binary_sensor": {
                switch (deviceClass) {
                    case "door":
                    case "garage_door":
                    case "opening":
                    case "window": {
                        return "contact";
                    }
                    case "motion": {
                        return "motion";
                    }
                }
                break;
            }
            case "sensor": {
                switch (deviceClass) {
                    case "atmospheric_pressure":
                    case "humidity":
                    case "temperature": {
                        return "climate";
                    }
                }
                break;
            }
            case "light": {
                return "light";
            }
        }

        return undefined;
    }

    /**
     * Get the suffixes to search related device entities with
     */
    private computeRelatedEntitySuffixes(entityType?: EntityType): string[] {
        switch (entityType) {
            case "air_purifier": {
                return ["temperature", "humidity", "pm2_5", "motor_speed"];
            }
            case "climate": {
                return ["temperature", "humidity", "battery", "last_seen"];
            }
            case "contact": {
                return ["battery", "last_seen"];
            }
            case "light": {
                return ["last_seen"];
            }
            case "motion": {
                return ["illuminance", "illuminance_lux", "battery", "last_seen"];
            }
        }

        return [];
    }

    /**
     * Compute the icon color to use based on the entity type
     */
    protected computeIconColorForEntityType(entityType?: EntityType): string | undefined {
        switch (entityType) {
            case "air_purifier": {
                return "green";
            }
            case "climate": {
                return "purple";
            }
            case "contact": {
                return "cyan";
            }
            case "light": {
                return "deep-orange";
            }
        }

        return undefined;
    }

    /**
     * Navigate Home Assistant to the Device Info page
     */
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

    protected renderControls(
        rtl: boolean,
        additionalButtons?: TemplateResult
    ): TemplateResult | typeof nothing {
        if (!this.isAdmin()) return nothing;

        return html`
            <mushroom-button-group ?rtl=${rtl} class="controls">
                ${additionalButtons ? additionalButtons : nothing}
                <mushroom-button
                    icon="mdi:cog-outline"
                    @click=${this.navigateToDeviceInfoPage}
                ></mushroom-button>
            </mushroom-button-group>
        `;
    }

    static get styles(): CSSResultGroup {
        return [
            super.styles,
            cardStyle,
            css`
                mushroom-state-item {
                    flex: 1 1 auto;
                }
                mushroom-shape-icon {
                    --icon-color: rgb(var(--rgb-state-entity));
                    --shape-color: rgba(var(--rgb-state-entity), 0.2);
                }
                mushroom-shape-icon.action {
                    cursor: pointer;
                }
                mushroom-shape-icon.pulse {
                    --shape-animation: 1s ease 0s infinite normal none running pulse;
                }
                mushroom-shape-icon.spin ha-state-icon {
                    animation: var(--animation-duration) infinite linear spin;
                }
                mushroom-button-group {
                    flex: 0 1 auto;
                    flex-basis: fit-content;
                    min-width: auto;
                }
                mushroom-button-group > mushroom-button {
                    flex: 0 1 auto;
                    width: calc(var(--control-height) * var(--control-button-ratio));
                    --bg-color: rgba(var(--rgb-disabled), 0.1);
                    --bg-color-disabled: rgba(var(--rgb-disabled), 0.1);
                }
            `,
        ];
    }
}
