import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    multiSelectAffixContainerVariants as monaMultiSelectAffixContainerVariants,
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectIndicatorContainerVariants as monaMultiSelectIndicatorContainerVariants,
    multiSelectItemContainerVariants as monaMultiSelectItemContainerVariants
} from "./multi-select.mona.styles";

const multiSelectBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMultiSelectBaseVariants },
    monaMultiSelectBaseVariants
);

export const multiSelectBaseThemeVariants = (theme: ThemeStyle) => multiSelectBaseThemeVariantsStrategy.resolve(theme);

const multiSelectItemContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMultiSelectItemContainerVariants },
    monaMultiSelectItemContainerVariants
);

export const multiSelectItemContainerThemeVariants = (theme: ThemeStyle) =>
    multiSelectItemContainerThemeVariantsStrategy.resolve(theme);

const multiSelectAffixContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMultiSelectAffixContainerVariants },
    monaMultiSelectAffixContainerVariants
);

export const multiSelectAffixContainerThemeVariants = (theme: ThemeStyle) =>
    multiSelectAffixContainerThemeVariantsStrategy.resolve(theme);

const multiSelectIndicatorContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaMultiSelectIndicatorContainerVariants },
    monaMultiSelectIndicatorContainerVariants
);

export const multiSelectIndicatorContainerThemeVariants = (theme: ThemeStyle) =>
    multiSelectIndicatorContainerThemeVariantsStrategy.resolve(theme);

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
