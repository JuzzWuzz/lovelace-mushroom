# AGENTS.md — Lovelace Mushroom (Juzz Addon Build)

## Project Overview

This is a fork of [lovelace-mushroom](https://github.com/piitaya/lovelace-mushroom) (Home Assistant Lovelace card library).
The working branch is **`all-cards`**. It builds a **separate addon JS file** — `dist/mushroom.js` — that contains only the custom Juzz cards and none of the standard Mushroom cards. This addon file is loaded alongside a separately installed base Mushroom build to avoid duplicate custom element registration errors.

The upstream `main` branch is periodically merged in. When that happens, check upstream changes against the juzz code for compatibility (see Upstream Sync section below).

---

## Repository Structure

```
src/
├── cards/           # Upstream Mushroom cards — DO NOT MODIFY
├── badges/          # Upstream Mushroom badges — DO NOT MODIFY
├── ha/              # HA type wrappers — mostly upstream
├── shared/          # Shared upstream config/components
├── utils/           # Shared upstream utilities
├── localize/        # Upstream i18n
├── mushroom.ts      # BUILD ENTRY POINT — see below
└── juzz/            # All custom Juzz code lives here
    ├── cards/
    │   ├── bar-card/
    │   ├── formatted-sensor-card/
    │   ├── shelly-card/
    │   └── zigbee2mqtt-card/
    ├── shared/
    │   ├── config/
    │   │   ├── base-device-config.ts    # Shared struct + form schema for device cards
    │   │   └── simple-layout-config.ts  # Shared layout/fill_container form schema
    │   ├── inline-state-item.ts         # <mushroom-inline-state-item> element
    │   ├── row-container.ts             # <mushroom-row-container> element
    │   └── slider-ex.ts                 # <mushroom-slider-ex> touch slider element
    └── utils/
        ├── base-device-card.ts          # Abstract base class for device cards
        ├── controls/
        │   └── device-controls.ts       # <mushroom-device-card-controls> element
        ├── const.ts                     # NO_VALUE = "N/A"
        ├── types.ts                     # DataType, DataTypeConfig, FormattedValue
        └── helpers.ts                   # capitalizeWords, getDataTypeConfig, formatValueAndUom
```

---

## Entry Point: `src/mushroom.ts`

The standard Mushroom card imports are **intentionally commented out**. This is by design — the addon build only includes Juzz cards so they can coexist with a separately installed base Mushroom instance without double-registering custom elements.

```ts
// import "./cards/alarm-control-panel-card/alarm-control-panel-card";  ← intentional, leave commented
// ...all other upstream card imports...

import "./juzz/cards/bar-card/bar-card";
import "./juzz/cards/formatted-sensor-card/formatted-sensor-card";
import "./juzz/cards/shelly-card/shelly-card";
import "./juzz/cards/zigbee2mqtt-card/zigbee2mqtt-card";
```

**Never uncomment the upstream card imports** and **never remove the Juzz card imports**.

---

## Build System

- **Bundler**: Rollup (`rollup.config.mjs`) with TypeScript, Babel, terser
- **Output**: `dist/mushroom.js` (single ES module, dynamic imports inlined)
- **Dev server**: served at `http://0.0.0.0:4000` during watch mode

```bash
npm run build        # Production build → dist/mushroom.js
npm run start        # Watch mode + local dev server on port 4000
npm run format       # Prettier formatting
```

---

## Card Architecture Pattern

Every Juzz card follows this 4-file structure:

```
my-card/
├── const.ts              # Card name constants, editor name, defaults
├── my-card-config.ts     # Config type, superstruct struct, helper functions
├── my-card-editor.ts     # LitElement editor implementing LovelaceCardEditor
└── my-card.ts            # LitElement card implementing LovelaceCard
```

### `const.ts`
```ts
export const MY_CARD_NAME = "mushroom-my-card";
export const MY_CARD_EDITOR_NAME = "mushroom-my-card-editor";
export const MY_CARD_DEFAULT_SHOW_FOO = true;
```

### `my-card-config.ts`
- Config type = intersection of `LovelaceCardConfig & EntitySharedConfig & SimpleAppearanceSharedConfig & ...`
- Struct = `assign(lovelaceCardConfigStruct, entitySharedConfigStruct, ...)` using superstruct
- Helper functions (not computed properties): `showFoo(config)`, `getMin(config)` etc. that apply defaults

```ts
export const showFoo = (config: MyCardConfig): boolean =>
  config.show_foo ?? MY_CARD_DEFAULT_SHOW_FOO;
```

### `my-card-editor.ts`
- Extends `MushroomBaseElement`, implements `LovelaceCardEditor`
- Schema is computed via `memoizeOne`-wrapped `computeSchema(customLocalize)` function
- Labels use `_computeLabel(schema)` which checks `GENERIC_LABELS` first then falls back to HA localisation
- In `render()`, populate defaults into a local `data` copy before passing to `ha-form`. Use a separate `displayData` spread if sentinel values are needed for display only (e.g. `"auto"` for unset enum selectors)
- In `_valueChanged()`, strip all default values before firing `config-changed` — keeps YAML minimal

```ts
const computeSchema = memoizeOne(
  (customLocalize: ReturnType<typeof setupCustomlocalize>): HaFormSchema[] => [
    // ...
  ]
);
```

### `my-card.ts`
- Extends either `MushroomBaseCard<Config>` (simple) or `MushroomBaseDeviceCard<Config>` (device)
- Implements `LovelaceCard`
- `setConfig()` merges sensible defaults (`primary_info`, `secondary_info`, `icon_type`) then calls `super` or sets `this._config`
- `getConfigElement()` uses dynamic import for the editor
- `getStubConfig()` finds a suitable entity to pre-fill the card

---

## Selector Conventions

| Purpose | Selector type |
|---|---|
| Color | `{ ui_color: {} }` |
| Boolean toggle | `{ boolean: {} }` |
| Enum dropdown | `{ select: { options: MY_OPTIONS, mode: "dropdown" } }` |
| Entity | `{ entity: { domain: ["sensor", ...] } }` |
| Icon | `{ icon: {} }` with `context: { icon_entity: "entity" }` |
| Text | `{ text: {} }` |
| Number | `{ number: { min, max, step, mode: "box" } }` |

### Enum dropdown with "Auto Detect" default

Use a sentinel string value `"auto"` (not `""`) for the "no selection" option. Empty string causes the Material Design label to overlap the option text.

```ts
const MY_OPTIONS = [
  { value: "auto", label: "Auto Detect" },
  ...MY_ENUM_VALUES.map((t) => ({ value: t, label: capitalizeWords(t) })),
];

// In render():
const displayData = { ...data, my_field: data.my_field ?? "auto" };

// In _valueChanged():
if (newConfig.my_field === "auto") delete newConfig.my_field;
```

---

## Base Classes

### `MushroomBaseCard<T, E>` (upstream `src/utils/base-card.ts`)
General base for all cards. Provides `_config`, `_stateObj`, `renderNotFound()`, `renderIcon()`, `renderBadge()`, `renderStateInfo()`.

### `MushroomBaseDeviceCard<T, E>` (juzz `src/juzz/utils/base-device-card.ts`)
Extends `MushroomBaseCard`. Adds:
- `device` getter — looks up `DeviceRegistryEntry` from `hass.entities` + `hass.devices` (no caching, always fresh)
- `useDeviceName()` / `getDeviceName()` — resolves device name vs entity friendly name
- `getDeviceEntities(entityType?)` — finds related entities on the same device by suffix matching
- `computeEntityType(hassEntity)` — auto-detects entity type from domain + device_class
- `getStateDisplay(stateObj)` — wraps `hass.formatEntityState()`
- `isAdmin()` — checks `hass.user?.is_admin`

Available `EntityType` values: `"air_purifier" | "climate" | "contact" | "light" | "motion"`

---

## Shared Juzz Config

### `SimpleAppearanceSharedConfig` (`src/juzz/shared/config/simple-layout-config.ts`)
Adds `layout` and `fill_container` to a card. Use `computeSimpleAppearanceFormSchema(customLocalize)` in editors (it's a function, not a static const, because layout options are localised).

### `BaseDeviceSharedConfig` (`src/juzz/shared/config/base-device-config.ts`)
Adds `use_device_name` and `show_device_controls`. Use `BASE_DEVICE_FORM_SCHEMA` (static, no localisation needed).

---

## Shared Juzz Elements

| Element | File | Purpose |
|---|---|---|
| `<mushroom-row-container>` | `shared/row-container.ts` | Flex row with alignment, rowType (primary/secondary/none), tightSpacing, noWrap |
| `<mushroom-inline-state-item>` | `shared/inline-state-item.ts` | Icon + slotted content in a compact row |
| `<mushroom-slider-ex>` | `shared/slider-ex.ts` | Touch slider via HammerJS; controllable/display modes |
| `<mushroom-device-card-controls>` | `utils/controls/device-controls.ts` | Update install buttons + device info button |

---

## Data Formatting

`src/juzz/utils/helpers.ts` exports:

- `capitalizeWords(str)` — `"snake_case"` → `"Snake Case"`
- `getDataTypeForDeviceClass(deviceClass?)` — maps HA device classes to `DataType`
- `getDataTypeConfig(dataType)` — returns `DataTypeConfig` (precision, unit, step)
- `formatValueAndUom(value, dataType, clampNegative)` — returns `FormattedValue` with `.formatted()` method

`DataType` values: `"energy" | "latency" | "percentage" | "power" | "temperature"`

---

## Upstream Sync Process

When merging `main` into `all-cards`, check these upstream changes for juzz impact:

1. **Selector type changes** — e.g. `mush_color` → `ui_color`, `ha-selector-select` → `ha-selector`
2. **Static schema → `memoizeOne` function** — if upstream converts `SCHEMA` arrays to `computeSchema(customLocalize)` functions, juzz editors need the same treatment
3. **Deleted shared components** — if upstream removes picker files or custom selector elements that juzz files import
4. **`computeAppearance` / `computeLayoutOptions` API changes** — juzz `simple-layout-config.ts` depends on these

The juzz cards do **not** import standard Mushroom card shared components at runtime (those are provided by the base Mushroom install). The commented-out imports in card files are intentional reference markers showing what the base build provides.

---

## Key Rules

- **Never modify files outside `src/juzz/` or `src/mushroom.ts`** unless explicitly asked
- **Never uncomment the upstream card imports in `src/mushroom.ts`**
- **Never add `""` as a sentinel value** for enum dropdowns — use `"auto"` and strip it in `_valueChanged`
- **Always strip default values in `_valueChanged`** — config in YAML should only contain non-default values
- **Always use `memoizeOne`** for `computeSchema` in editors — schema functions take `customLocalize` as argument
- **Always use `computeSimpleAppearanceFormSchema(customLocalize)`** (function call, not a const import) for layout/fill_container fields
