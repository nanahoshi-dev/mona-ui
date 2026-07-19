import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const switchThemeVariants = cva(
    `
        group relative flex items-center
        cursor-pointer select-none
        bg-input-background
        border border-input-border
        outline-none
        transition-[background,border-color]

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground

        data-[active='true']:bg-primary
        data-[active='true']:text-primary-foreground
        data-[disabled='true']:data-[active='true']:bg-disabled-background

        focus-visible:border-focus-indicator
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35

        [&.ng-touched.ng-invalid]:border-error
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-visible:border-error
        data-[invalid='true']:focus-visible:ring-error/35
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
                large: "h-7.5 w-14 text-md",
                medium: "h-6.5 w-12 text-sm",
                small: "h-5.5 w-10 text-xs"
            }
        }
    }
);

export const switchHandleThemeVariants = cva(
    `
        absolute inline-flex items-center justify-center
        bg-surface-raised text-foreground
        border border-border-subtle shadow-(--shadow-control)
        outline-none
        transition-[left,background] duration-(--mona-motion-standard) ease-in-out
        data-[active='true']:bg-primary-foreground
        group-data-[disabled='true']:border-disabled-border
        group-data-[disabled='true']:bg-disabled-background
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
                large: `
                    h-6 w-6
                    data-[active='true']:left-[calc(100%-26px)]
                    data-[active='false']:left-0.5
                `,
                medium: `
                    h-5 w-5
                    data-[active='true']:left-[calc(100%-22px)]
                    data-[active='false']:left-0.5
                `,
                small: `
                    h-4 w-4
                    data-[active='true']:left-[calc(100%-18px)]
                    data-[active='false']:left-0.5
                `
            }
        }
    }
);

export const switchLabelThemeVariants = cva(
    `
        flex h-full flex-1 items-center justify-center text-xs
    `
);

type SwitchBaseVariantProps = VariantProps<typeof switchThemeVariants>;

type SwitchBaseVariantInput = VariantInputs<SwitchBaseVariantProps>;

type SwitchHandleVariantProps = VariantProps<typeof switchHandleThemeVariants>;

type SwitchHandleVariantInput = VariantInputs<SwitchHandleVariantProps>;

type SwitchLabelVariantProps = VariantProps<typeof switchLabelThemeVariants>;

type SwitchLabelVariantInput = VariantInputs<SwitchLabelVariantProps>;

export type SwitchVariantProps = SwitchBaseVariantProps & SwitchHandleVariantProps & SwitchLabelVariantProps;

export type SwitchVariantInputs = SwitchBaseVariantInput & SwitchHandleVariantInput & SwitchLabelVariantInput;
