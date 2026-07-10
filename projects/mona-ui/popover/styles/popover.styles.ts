import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { tooltipArrowThemeVariants } from "@nanahoshi/mona-ui/tooltip";
import { VariantProps } from "class-variance-authority";
import {
    popoverBaseVariants as monaPopoverBaseVariants,
    popoverContentVariants as monaPopoverContentVariants,
    popoverHeaderVariants as monaPopoverHeaderVariants
} from "./popover.mona.styles";

const popoverBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopoverBaseVariants },
    monaPopoverBaseVariants
);

export const popoverBaseThemeVariants = (theme: ThemeStyle) => popoverBaseThemeVariantsStrategy.resolve(theme);

const popoverHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopoverHeaderVariants },
    monaPopoverHeaderVariants
);

export const popoverHeaderThemeVariants = (theme: ThemeStyle) => popoverHeaderThemeVariantsStrategy.resolve(theme);

const popoverContentThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopoverContentVariants },
    monaPopoverContentVariants
);

export const popoverContentThemeVariants = (theme: ThemeStyle) => popoverContentThemeVariantsStrategy.resolve(theme);

export const popoverArrowThemeVariants = (theme: ThemeStyle) => {
    return tooltipArrowThemeVariants(theme);
};

type PopoverBaseVariantProps = VariantProps<ReturnType<typeof popoverBaseThemeVariants>>;
type PopoverBaseVariantInputs = VariantInputs<PopoverBaseVariantProps>;

type PopoverHeaderVariantProps = VariantProps<ReturnType<typeof popoverHeaderThemeVariants>>;
type PopoverHeaderVariantInputs = VariantInputs<PopoverHeaderVariantProps>;

type PopoverContentVariantProps = VariantProps<ReturnType<typeof popoverContentThemeVariants>>;
type PopoverContentVariantInputs = VariantInputs<PopoverContentVariantProps>;

type PopoverArrowVariantProps = VariantProps<ReturnType<typeof popoverArrowThemeVariants>>;
type PopoverArrowVariantInputs = VariantInputs<PopoverArrowVariantProps>;

export type PopoverVariantProps = PopoverBaseVariantProps &
    PopoverHeaderVariantProps &
    PopoverContentVariantProps &
    PopoverArrowVariantProps;
export type PopoverVariantInputs = PopoverBaseVariantInputs &
    PopoverHeaderVariantInputs &
    PopoverContentVariantInputs &
    PopoverArrowVariantInputs;
