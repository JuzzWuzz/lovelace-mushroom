import { Infer, boolean, object, optional } from "superstruct";
import { HaFormSchema } from "../../../utils/form/ha-form";

export const baseDeviceSharedConfigStruct = object({
  use_device_name: optional(boolean()),
  show_device_controls: optional(boolean()),
});

export type BaseDeviceSharedConfig = Infer<typeof baseDeviceSharedConfigStruct>;

export const BASE_DEVICE_FORM_SCHEMA: HaFormSchema[] = [
  {
    type: "grid",
    name: "",
    schema: [
      { name: "use_device_name", selector: { boolean: {} } },
      { name: "show_device_controls", selector: { boolean: {} } },
    ],
  },
];
