import { cva, type VariantProps } from "class-variance-authority";

export const alertThemeVariants = cva(
    `
        relative flex w-full items-start gap-3
        rounded-lg border p-4 text-sm
    `,
    {
        variants: {
            look: {
                error: "bg-error-subtle text-error-subtle-foreground border-error-border",
                info: "bg-info-subtle text-info-subtle-foreground border-info-border",
                neutral: "bg-secondary-subtle text-secondary-subtle-foreground border-secondary-border",
                success: "bg-success-subtle text-success-subtle-foreground border-success-border",
                warning: "bg-warning-subtle text-warning-subtle-foreground border-warning-border"
            }
        },
        defaultVariants: {
            look: "info"
        }
    }
);

/** The icon's box is one line of text tall, so the icon centers on the first line, title or not. */
export const ALERT_ICON_CLASSES = "flex h-5 shrink-0 items-center [&>svg]:size-4";

export const ALERT_BODY_CLASSES = "flex min-w-0 flex-1 flex-col gap-1 leading-5";

export const ALERT_TITLE_CLASSES = "font-semibold";

/** The dismiss button sits in the corner, its box pulled out so its icon lines up with the padding. */
export const ALERT_DISMISS_CLASSES = "-my-1.5 -me-2 shrink-0 text-current";

export const alertActionsThemeVariants = cva("mt-2 flex flex-wrap items-center gap-2");

export type AlertVariantProps = VariantProps<typeof alertThemeVariants>;
