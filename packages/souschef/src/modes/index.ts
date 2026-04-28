import type { ModeName } from "../model/types.js";
import type { ModeConfig } from "./plan.js";
import { planMode } from "./plan.js";
import { editMode } from "./edit.js";

export { planMode, editMode };
export type { ModeConfig };

export function getMode(name: ModeName): ModeConfig {
  return name === "plan" ? planMode : editMode;
}
