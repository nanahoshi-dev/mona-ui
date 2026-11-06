import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const stepperBaseThemeVariants = cva(
    `
        relative grid
    `,
    {
        variants: {
            orientation: {
                horizontal: "h-auto w-full",
                vertical: "h-full w-auto"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperStepListThemeVariants = cva(
    `
        absolute z-1 col-span-full flex list-none
        font-medium
    `,
    {
        variants: {
            orientation: {
                horizontal: `
                    w-full flex-row
                    -translate-y-3
                `,
                vertical: `
                    h-full w-max flex-col
                    -translate-x-3 rtl:translate-x-3
                `
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperStepListItemThemeVariants = cva(
    `
        z-1 flex grow-1 shrink-0 basis-auto items-center
    `,
    {
        variants: {
            orientation: {
                horizontal: "flex-col gap-2",
                vertical: "flex-row justify-start gap-2"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperStepIndicatorThemeVariants = cva(
    `
        flex h-8 w-8 items-center justify-center
        border border-border cursor-[inherit]
        transition-colors duration-(--mona-motion-standard) ease-in-out
        focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-indicator
    `,
    {
        variants: {
            invalid: {
                true: "border-2 border-error",
                false: ""
            },
            state: {
                completed: "bg-primary text-primary-foreground forced-colors:border-[Highlight]",
                current: `
                    bg-primary text-primary-foreground
                    ring-2 ring-primary ring-offset-2 ring-offset-surface
                    forced-colors:border-2 forced-colors:border-[Highlight]
                `,
                disabled: "border-dashed bg-surface-muted text-disabled-foreground",
                upcoming: "bg-surface-raised text-foreground"
            },
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        }
    }
);

/** The button around a `monaStepperStepTemplate`, whose looks are the template's. */
export const stepperStepButtonThemeVariants = cva(
    `
        cursor-[inherit] rounded-sm
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-indicator
    `
);

export const stepperStepLabelThemeVariants = cva("", {
    variants: {
        state: {
            completed: "",
            current: "font-semibold",
            disabled: "text-disabled-foreground",
            upcoming: ""
        }
    }
});

export const stepperTrackThemeVariants = cva(
    `
        relative grid
        bg-surface-muted text-foreground
        border border-border-subtle
    `,
    {
        variants: {
            orientation: {
                horizontal: "h-2 w-full",
                vertical: "h-full w-2"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperTrackLineThemeVariants = cva(
    `
        absolute start-0 top-0 bg-primary
    `,
    {
        variants: {
            orientation: {
                horizontal: "h-full transition-width duration-(--mona-motion-standard) ease-out",
                vertical: "w-full transition-height duration-(--mona-motion-standard) ease-out"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

type StepperBaseVariantProps = VariantProps<typeof stepperBaseThemeVariants>;

type StepperBaseVariantInput = VariantInputs<StepperBaseVariantProps>;

type StepperStepListVariantProps = VariantProps<typeof stepperStepListThemeVariants>;

type StepperStepListVariantInput = VariantInputs<StepperStepListVariantProps>;

type StepperStepListItemVariantProps = VariantProps<typeof stepperStepListItemThemeVariants>;

type StepperStepListItemVariantInput = VariantInputs<StepperStepListItemVariantProps>;

type StepperStepIndicatorVariantProps = VariantProps<typeof stepperStepIndicatorThemeVariants>;

type StepperStepIndicatorVariantInput = VariantInputs<StepperStepIndicatorVariantProps>;

type StepperTrackVariantProps = VariantProps<typeof stepperTrackThemeVariants>;

type StepperTrackVariantInput = VariantInputs<StepperTrackVariantProps>;

type StepperTrackLineVariantProps = VariantProps<typeof stepperTrackLineThemeVariants>;

type StepperTrackLineVariantInput = VariantInputs<StepperTrackLineVariantProps>;

export type StepperVariantProps = StepperBaseVariantProps &
    StepperStepListVariantProps &
    StepperStepListItemVariantProps &
    StepperStepIndicatorVariantProps &
    StepperTrackVariantProps &
    StepperTrackLineVariantProps;

export type StepperVariantInput = StepperBaseVariantInput &
    StepperStepListVariantInput &
    StepperStepListItemVariantInput &
    Omit<StepperStepIndicatorVariantInput, "invalid" | "state"> &
    StepperTrackVariantInput &
    StepperTrackLineVariantInput;
