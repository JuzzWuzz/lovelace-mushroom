import { PREFIX_NAME } from "../../../const";

export const LIGHT_BUTTONS_CARD_NAME = `${PREFIX_NAME}-light-buttons-card`;
export const LIGHT_BUTTONS_CARD_EDITOR_NAME = `${LIGHT_BUTTONS_CARD_NAME}-editor`;
export const LIGHT_ENTITY_DOMAINS = ["light"];

export const LIGHT_BUTTONS_DEFAULT_SHOW_LABELS = true;

export function computeButtonEditorComponentName(type: string): string {
  return `${PREFIX_NAME}-${type}-button-editor`;
}
