import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    multiSelectAffixContainerVariants as annaMultiSelectAffixContainerVariants,
    multiSelectBaseVariants as annaMultiSelectBaseVariants,
    multiSelectIndicatorContainerVariants as annaMultiSelectIndicatorContainerVariants,
    multiSelectItemContainerVariants as annaMultiSelectItemContainerVariants
} from "./multi-select.anna.styles";
import {
    multiSelectAffixContainerVariants as monaMultiSelectAffixContainerVariants,
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectIndicatorContainerVariants as monaMultiSelectIndicatorContainerVariants,
    multiSelectItemContainerVariants as monaMultiSelectItemContainerVariants
} from "./multi-select.mona.styles";

export const multiSelectBaseThemeVariants = createThemeStrategy({
    anna: annaMultiSelectBaseVariants,
    mona: monaMultiSelectBaseVariants
});

export const multiSelectItemContainerThemeVariants = createThemeStrategy({
    anna: annaMultiSelectItemContainerVariants,
    mona: monaMultiSelectItemContainerVariants
});

export const multiSelectAffixContainerThemeVariants = createThemeStrategy({
    anna: annaMultiSelectAffixContainerVariants,
    mona: monaMultiSelectAffixContainerVariants
});

export const multiSelectIndicatorContainerThemeVariants = createThemeStrategy({
    anna: annaMultiSelectIndicatorContainerVariants,
    mona: monaMultiSelectIndicatorContainerVariants
});

type MultiSelectBaseVariantProps = VariantProps<ReturnType<typeof multiSelectBaseThemeVariants>>;
type MultiSelectBaseVariantInput = VariantInputs<MultiSelectBaseVariantProps>;

type MultiSelectItemContainerVariantProps = VariantProps<ReturnType<typeof multiSelectItemContainerThemeVariants>>;
type MultiSelectItemContainerVariantInput = VariantInputs<MultiSelectItemContainerVariantProps>;

type MultiSelectAffixContainerVariantProps = VariantProps<ReturnType<typeof multiSelectAffixContainerThemeVariants>>;
type MultiSelectAffixContainerVariantInput = VariantInputs<MultiSelectAffixContainerVariantProps>;

type MultiSelectIndicatorContainerVariantProps = VariantProps<
    ReturnType<typeof multiSelectIndicatorContainerThemeVariants>
>;
type MultiSelectIndicatorContainerVariantInput = VariantInputs<MultiSelectIndicatorContainerVariantProps>;

export type MultiSelectVariantProps = MultiSelectBaseVariantProps &
    MultiSelectItemContainerVariantProps &
    MultiSelectAffixContainerVariantProps &
    MultiSelectIndicatorContainerVariantProps;
export type MultiSelectVariantInput = Omit<MultiSelectBaseVariantInput, "focused" | "invalid"> &
    MultiSelectItemContainerVariantInput &
    MultiSelectAffixContainerVariantInput &
    MultiSelectIndicatorContainerVariantInput;
