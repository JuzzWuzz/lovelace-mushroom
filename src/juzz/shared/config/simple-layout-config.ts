import { Infer, boolean, object, optional } from "superstruct";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { layoutStruct } from "../../../utils/layout";

export const simpleAppearanceSharedConfigStruct = object({
    layout: optional(layoutStruct),
    fill_container: optional(boolean()),
});

export type SimpleAppearanceSharedConfig = Infer<typeof simpleAppearanceSharedConfigStruct>;

export const SIMPLE_APPEARANCE_FORM_SCHEMA: HaFormSchema[] = [
    {
        type: "grid",
        name: "",
        schema: [
            { name: "layout", selector: { mush_layout: {} } },
            { name: "fill_container", selector: { boolean: {} } },
        ],
    },
];
