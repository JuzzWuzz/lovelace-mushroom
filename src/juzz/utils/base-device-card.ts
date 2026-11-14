import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup } from "lit";
import { DeviceRegistryEntry, UNAVAILABLE, UNKNOWN } from "../../ha";
import "../shared/inline-state-item";
import "../shared/row-container";
import { MushroomBaseCard } from "../../utils/base-card";
import { cardStyle } from "../../utils/card-styles";
import { EntitySharedConfig } from "../../shared/config/entity-config";
import { AppearanceSharedConfig } from "../../shared/config/appearance-config";
import "./controls/device-controls";

export const ENTITY_TYPES = [
  "air_purifier",
  "climate",
  "contact",
  "light",
  "motion",
  "wireless_button",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

type BaseConfig = EntitySharedConfig & AppearanceSharedConfig;

export class MushroomBaseDeviceCard<
  T extends BaseConfig = BaseConfig,
  E extends HassEntity = HassEntity,
> extends MushroomBaseCard<T, E> {
  get device(): DeviceRegistryEntry | undefined {
    if (!this.hass || !this._config?.entity) return undefined;
    const deviceId = this.hass.entities[this._config.entity]?.device_id;
    return deviceId ? this.hass.devices[deviceId] : undefined;
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

    const relatedEntities = Object.values(this.hass.entities)
      .filter(
        (entity) =>
          entity.device_id === deviceId && entity.entity_id !== entityId
      )
      .map((entity) => this.hass.states[entity.entity_id])
      .filter((state) => state !== undefined);

    if (entityType === "air_purifier" && !configRelatedEntitiesSuffixes) {
      return this.getAirPurifierEntities(relatedEntities);
    }

    const suffixes =
      configRelatedEntitiesSuffixes ??
      this.computeRelatedEntitySuffixes(entityType);
    return relatedEntities.filter((state) =>
      suffixes.some((suffix) => state.entity_id.endsWith(suffix))
    );
  }

  private getAirPurifierEntities(entities: HassEntity[]): HassEntity[] {
    const sensors = entities.filter(
      (state) =>
        state.entity_id.startsWith("sensor.") &&
        state.state !== "" &&
        ![UNAVAILABLE, UNKNOWN].includes(state.state)
    );
    const bySuffix = (suffix: string) =>
      sensors.find((sensor) => sensor.entity_id.endsWith(suffix));

    const pm25 =
      bySuffix("_pm25_density") ??
      sensors.find((sensor) => sensor.attributes.device_class === "pm25") ??
      bySuffix("pm2_5");

    // Show the reported units (no AQI or RPM inferred from another metric).
    return [
      pm25,
      bySuffix("_filter_life_level"),
      bySuffix("motor_speed"),
    ].filter((sensor) => sensor !== undefined);
  }

  protected getStateDisplay(stateObj: HassEntity) {
    return this.hass.formatEntityState(stateObj);
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
          case "motion":
          case "occupancy": {
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
      case "climate": {
        return ["temperature", "humidity", "battery", "last_seen"];
      }
      case "contact":
      case "wireless_button": {
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
