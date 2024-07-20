import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, TemplateResult, html, nothing } from "lit";
import { DeviceRegistryEntry, computeStateDisplay, fireEvent } from "../../ha";
import "../shared/inline-state-item";
import "../shared/row-container";
import { MushroomBaseCard } from "../../utils/base-card";
import { cardStyle } from "../../utils/card-styles";
import { EntitySharedConfig } from "../../shared/config/entity-config";
import { AppearanceSharedConfig } from "../../shared/config/appearance-config";
import "./controls/device-controls";

export const ENTITY_TYPES = ["air_purifier", "climate", "contact", "light", "motion"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

type BaseConfig = EntitySharedConfig & AppearanceSharedConfig;

export class MushroomBaseDeviceCard<
    T extends BaseConfig = BaseConfig,
    E extends HassEntity = HassEntity,
> extends MushroomBaseCard<T, E> {
    private _device?: DeviceRegistryEntry;
    get device(): DeviceRegistryEntry | undefined {
        if (!this._device && this.hass && this._config?.entity) {
            const deviceId = this.hass.entities[this._config.entity]?.device_id;
            if (deviceId) {
                this._device = this.hass.devices[deviceId];
            }
        }

        return this._device;
    }

    protected useDeviceNameDefault: boolean = false;
    protected useDeviceName(): boolean {
        if (this._config && "use_device_name" in this._config) {
            return this._config.use_device_name === true;
        } else {
            return this.useDeviceNameDefault;
        }
    }

    protected getDeviceName(): string | undefined {
        return (this.useDeviceName() ? this.device?.name : null) ?? undefined;
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
        const entityId = this._config?.entity;

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
                return ["pm2_5", "motor_speed"];
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

    static get styles(): CSSResultGroup {
        return [
            super.styles,
            cardStyle,
            css`
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
                .actions {
                    justify-content: flex-end;
                    flex-grow: 0;
                    flex-shrink: 1;
                    flex-basis: fit-content;
                }
                .actions > mushroom-row-container {
                    align-items: center;
                    flex-grow: 1;
                }
            `,
        ];
    }
}
