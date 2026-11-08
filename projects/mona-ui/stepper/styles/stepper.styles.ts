import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const stepperBaseThemeVariants = cva(
    `
        relative
    `,
    {
        variants: {
            orientation: {
                horizontal: "grid h-auto w-full",
                // A flex row stretches the step list to the stepper's height.
                vertical: "flex h-full w-auto"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

/** The list is in the flow, so the stepper's box holds the indicators and labels. The track is drawn behind it. */
export const stepperStepListThemeVariants = cva(
    `
        relative z-1 col-span-full flex list-none
        font-medium
    `,
    {
        variants: {
            orientation: {
                horizontal: "w-full flex-row",
                vertical: "w-max flex-col"
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
                completed: `
                    bg-[var(--mona-indicator-color,var(--color-primary))]
                    text-[var(--mona-indicator-foreground,var(--color-primary-foreground))]
                    forced-colors:border-[Highlight]
                `,
                current: `
                    bg-[var(--mona-indicator-color,var(--color-primary))]
                    text-[var(--mona-indicator-foreground,var(--color-primary-foreground))]
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

/** Placed by the component, from the first indicator's centre to the last one's. */
export const stepperTrackThemeVariants = cva(
    `
        absolute
        bg-surface-muted text-foreground
        border border-border-subtle
    `,
    {
        variants: {
            orientation: {
                horizontal: "h-2",
                vertical: "w-2"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperTrackLineThemeVariants = cva(
    `
        absolute start-0 top-0 bg-[var(--mona-indicator-color,var(--color-primary))]
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
