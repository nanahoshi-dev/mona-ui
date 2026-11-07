import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";

export const commandBaseThemeVariants = cva(
    `
        flex max-h-[inherit] min-h-0 w-full flex-col overflow-hidden
        bg-[var(--mona-command-background,var(--color-surface))] text-foreground
        border border-border-subtle
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const commandInputThemeVariants = cva(
    `
        flex shrink-0 items-center gap-2 border-b border-border-subtle px-3
        focus-within:border-b-focus-indicator
    `
);

export const commandInputIconThemeVariants = cva("shrink-0 text-muted-foreground");

export const commandInputFieldThemeVariants = cva(
    `
        h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground
        placeholder:text-muted-foreground
        outline-none focus-visible:outline-hidden
    `
);

export const commandListThemeVariants = cva(
    `
        min-h-0 flex-1 overflow-y-auto overscroll-contain p-1
        max-h-[var(--mona-command-list-max-height,20rem)]
    `
);

export const commandGroupThemeVariants = cva("block");

export const commandGroupHeadingThemeVariants = cva("px-2 py-1.5 text-xs font-medium text-muted-foreground");

export const commandItemThemeVariants = cva(
    `
        flex min-h-8 cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground
        data-[active='true']:bg-[var(--mona-command-item-active-background,var(--color-hover))]
        data-[active='true']:forced-color-adjust-none
        data-[active='true']:forced-colors:bg-[Highlight]
        data-[active='true']:forced-colors:text-[HighlightText]
        data-[disabled='true']:opacity-50
        forced-colors:data-[disabled='true']:text-[GrayText]
    `
);

export const commandHighlightMarkThemeVariants = cva("bg-transparent font-semibold text-current underline");

export const commandSeparatorThemeVariants = cva("-mx-1 my-1 block h-px bg-border-subtle forced-colors:bg-[CanvasText]");

export const commandStatusThemeVariants = cva("px-3 py-6 text-center text-sm text-muted-foreground");

export const commandHeaderThemeVariants = cva(
    "flex shrink-0 items-center gap-2 border-b border-border-subtle px-3 py-2 text-xs text-muted-foreground"
);

export const commandFooterThemeVariants = cva(
    "flex shrink-0 items-center gap-2 border-t border-border-subtle px-3 py-2 text-xs text-muted-foreground"
);

export const commandShortcutThemeVariants = cva("ms-auto flex shrink-0 items-center gap-1");

export const commandShortcutKeyThemeVariants = cva(
    `
        rounded-sm border border-border-subtle px-1 font-sans text-xs text-muted-foreground
        in-data-[active='true']:forced-colors:border-[HighlightText]
        in-data-[active='true']:forced-colors:text-[HighlightText]
    `
);

export const commandDialogPanelThemeVariants = cva(
    `
        flex max-h-[inherit] min-h-0 w-full flex-col overflow-hidden rounded-md shadow-(--shadow-overlay)
        outline-none focus-visible:outline-hidden
    `
);

export type CommandVariantProps = VariantProps<typeof commandBaseThemeVariants>;
export type CommandVariantInput = VariantInputs<CommandVariantProps>;
