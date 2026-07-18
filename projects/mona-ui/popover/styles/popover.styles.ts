import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    popoverArrowVariants as annaPopoverArrowVariants,
    popoverBaseVariants as annaPopoverBaseVariants,
    popoverContentVariants as annaPopoverContentVariants,
    popoverHeaderVariants as annaPopoverHeaderVariants
} from "./popover.anna.styles";
import {
    popoverArrowVariants as monaPopoverArrowVariants,
    popoverBaseVariants as monaPopoverBaseVariants,
    popoverContentVariants as monaPopoverContentVariants,
    popoverHeaderVariants as monaPopoverHeaderVariants
} from "./popover.mona.styles";

export const popoverBaseThemeVariants = createThemeStrategy({
    anna: annaPopoverBaseVariants,
    mona: monaPopoverBaseVariants
});

export const popoverHeaderThemeVariants = createThemeStrategy({
    anna: annaPopoverHeaderVariants,
    mona: monaPopoverHeaderVariants
});

export const popoverContentThemeVariants = createThemeStrategy({
    anna: annaPopoverContentVariants,
    mona: monaPopoverContentVariants
});

export const popoverArrowThemeVariants = createThemeStrategy({
    anna: annaPopoverArrowVariants,
    mona: monaPopoverArrowVariants
});

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
