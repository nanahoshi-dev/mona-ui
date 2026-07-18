import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    popoverArrowVariants as monaPopoverArrowVariants,
    popoverBaseVariants as monaPopoverBaseVariants,
    popoverContentVariants as monaPopoverContentVariants,
    popoverHeaderVariants as monaPopoverHeaderVariants
} from "./popover.mona.styles";

export const popoverBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopoverBaseVariants;
        default:
            return monaPopoverBaseVariants;
    }
};

export const popoverHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopoverHeaderVariants;
        default:
            return monaPopoverHeaderVariants;
    }
};

export const popoverContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopoverContentVariants;
        default:
            return monaPopoverContentVariants;
    }
};

export const popoverArrowThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopoverArrowVariants;
        default:
            return monaPopoverArrowVariants;
    }
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
