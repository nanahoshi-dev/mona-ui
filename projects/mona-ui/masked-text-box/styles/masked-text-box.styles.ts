import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { themeControlSurfaceClasses } from "@nanahoshi/mona-ui/internal";

export const maskedTextBoxThemeVariants = cva(
    `
        flex w-full min-w-0 items-center
        overflow-hidden
        ${themeControlSurfaceClasses} text-foreground
        border border-input-border shadow-(--shadow-control)
        outline-none focus-visible:outline-hidden
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-(--mona-motion-standard) ease-in-out

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        focus-within:border-focus-indicator
        focus-within:ring-2 focus-within:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error/35
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            },
            size: {
                large: "h-10 text-base",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        }
    }
);

/** Holds the input and the ghost on top of each other. */
export const MASKED_TEXT_BOX_FIELD_CLASSES = "relative flex h-full min-w-0 flex-1 items-center";

/**
 * The rest of the mask, drawn behind the input after what's typed. It shares the input's padding and font, so its
 * characters line up with the input's.
 */
export const MASKED_TEXT_BOX_GHOST_CLASSES = `
    pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre px-2
    text-muted-foreground forced-colors:text-[GrayText]
`;

export const MASKED_TEXT_BOX_INPUT_CLASSES = `
    relative h-full w-full min-w-0 px-2
    bg-transparent border-0 outline-none focus-visible:outline-hidden
    placeholder:text-muted-foreground
`;

export type MaskedTextBoxVariantProps = VariantProps<typeof maskedTextBoxThemeVariants>;

export type MaskedTextBoxVariantInput = VariantInputs<MaskedTextBoxVariantProps>;
