/*
 * Public API Surface of @nanahoshi/mona-ui/fieldset
 */

export * from "./directives/fieldset-legend-template.directive";
export * from "./components/fieldset/fieldset.component";

export {
    createFieldsetStyleStrategy,
    FIELDSET_STYLE_OVERRIDES,
    FIELDSET_STYLE_STRATEGY,
    provideFieldsetStyles
} from "./styles/fieldset.styles";
export type {
    FieldsetBaseStyleOverrides,
    FieldsetBaseVariantInput,
    FieldsetBaseVariantProps,
    FieldsetFieldsetCompoundStyleOverride,
    FieldsetFieldsetStyleOverrides,
    FieldsetFieldsetVariantInput,
    FieldsetFieldsetVariantProps,
    FieldsetLegendCompoundStyleOverride,
    FieldsetLegendStyleOverrides,
    FieldsetLegendVariantInput,
    FieldsetLegendVariantProps,
    FieldsetStyleOverrides,
    FieldsetStylesProviderConfig,
    FieldsetStyleStrategy,
    FieldsetVariantInput,
    FieldsetVariantProps,
    FieldsetVariantsFunctions
} from "./styles/fieldset.styles";
