import { Infer, boolean, object, optional } from "superstruct";
import { computeLayoutOptions } from "../../../shared/config/appearance-config";
import setupCustomlocalize from "../../../localize";
import { HaFormSchema } from "../../../utils/form/ha-form";
import { layoutStruct } from "../../../utils/layout";

export const simpleAppearanceSharedConfigStruct = object({
  layout: optional(layoutStruct),
  fill_container: optional(boolean()),
});

export type SimpleAppearanceSharedConfig = Infer<
  typeof simpleAppearanceSharedConfigStruct
>;

export function computeSimpleAppearanceFormSchema(
  customLocalize: ReturnType<typeof setupCustomlocalize>
): HaFormSchema[] {
  return [
    {
      type: "grid",
      name: "",
      schema: [
        {
          name: "layout",
          selector: {
            select: {
              options: computeLayoutOptions(customLocalize),
              mode: "dropdown",
            },
          },
        },
        { name: "fill_container", selector: { boolean: {} } },
      ],
    },
  ];
}
