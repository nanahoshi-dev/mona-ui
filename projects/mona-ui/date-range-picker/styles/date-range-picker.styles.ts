import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";

export const dateRangePickerBaseThemeVariants = cva(
    `
        flex w-fit max-w-full items-center
        overflow-hidden
        ${themeControlSurfaceClasses} text-foreground
        border border-input-border shadow-(--shadow-control)
        outline-none focus-visible:outline-hidden

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        focus-within:border-focus-indicator
        focus-within:ring-(length:--mona-focus-ring-width,2px) focus-within:ring-focus-indicator/(--mona-focus-ring-opacity,35%)

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-(length:--mona-focus-ring-width,2px) data-[invalid='true']:ring-error/(--mona-focus-ring-opacity,35%)
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error/(--mona-focus-ring-opacity,35%)

        [&_mona-text-box]:h-full
        [&_mona-text-box]:min-w-0
        [&_mona-text-box]:border-none
        [&_mona-text-box]:shadow-none
        [&_mona-text-box]:focus-within:ring-0
        [&_mona-text-box[data-invalid='true']]:ring-0
        [&_mona-text-box[data-invalid='true']_input]:text-error
    `,
    {
        variants: {
            focused: {
                true: "border-focus-indicator ring-(length:--mona-focus-ring-width,2px) ring-focus-indicator/(--mona-focus-ring-opacity,35%)",
                false: ""
            },
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
        },
        compoundVariants: [
            {
                focused: true,
                class: "data-[invalid='true']:border-error data-[invalid='true']:ring-error/(--mona-focus-ring-opacity,35%)"
            }
        ]
    }
);

/**
 * Keeps the popup inside a narrow screen, where the calendar's months wrap onto new rows instead. The quick ranges sit
 * beside the calendar, and above it on a phone.
 */
export const dateRangePickerPopupThemeVariants = cva(`flex max-w-[calc(100dvw-1rem)] max-sm:flex-col`);

/** One input and the hidden text that sizes it, in one grid cell, so the input is as wide as its longest date. */
export const dateRangePickerFieldThemeVariants = cva(`inline-grid h-full min-w-0 [&>*]:col-start-1 [&>*]:row-start-1`);

/** The hidden text that sizes an input. Its padding matches the input's, and leaves room for the clear button. */
export const dateRangePickerSizerThemeVariants = cva(`invisible h-0 overflow-hidden whitespace-pre ps-2 tabular-nums`, {
    variants: {
        clearButton: {
            false: "pe-2",
            true: "pe-9"
        }
    }
});

/** The quick ranges: a column beside the calendar, or rows above it on a phone. */
export const dateRangePickerPresetListThemeVariants = cva(`
    flex shrink-0 flex-col gap-0.5 border-border p-2
    sm:border-e
    max-sm:flex-row max-sm:flex-wrap max-sm:border-b
`);

/** A quick range, with the picker's text size, as tall as a row of the calendar. */
export const dateRangePickerPresetThemeVariants = cva(`justify-start font-normal whitespace-nowrap`, {
    variants: {
        size: {
            large: "h-9 text-base",
            medium: "h-8 text-sm",
            small: "h-7 text-xs"
        }
    }
});

/**
 * The calendar button: a square as tall as the inside of the control, whose border takes 2px. Its width is set rather
 * than taken from its height, so a control sized to its contents leaves room for it in every browser.
 */
export const dateRangePickerButtonThemeVariants = cva(`ms-auto h-full shrink-0`, {
    variants: {
        size: {
            large: "w-[calc(--spacing(10)-2px)]",
            medium: "w-[calc(--spacing(9)-2px)]",
            small: "w-[calc(--spacing(8)-2px)]"
        }
    }
});

/** The dash between the two inputs, which is only drawn: each input has a name of its own. */
export const dateRangePickerSeparatorThemeVariants = cva(`shrink-0 select-none px-1 text-muted-foreground`);

type DateRangePickerBaseVariantProps = VariantProps<typeof dateRangePickerBaseThemeVariants>;

type DateRangePickerBaseVariantInput = VariantInputs<DateRangePickerBaseVariantProps>;

export type DateRangePickerVariantProps = DateRangePickerBaseVariantProps;

export type DateRangePickerVariantInput = Omit<DateRangePickerBaseVariantInput, "focused">;
