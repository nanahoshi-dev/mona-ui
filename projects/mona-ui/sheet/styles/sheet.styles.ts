import { themeOverlaySurfaceClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * `overflow-clip` rather than `overflow-hidden` is deliberate. `hidden` would make the sheet a scroll
 * container, letting the browser scroll it to reveal content that takes focus while the enter animation
 * still has the sheet translated off-screen, which cancels the animation. `clip` cannot scroll.
 */
export const sheetBaseVariants = cva(
    `
        relative flex h-full w-full min-w-0 min-h-0 max-h-[inherit] flex-col overflow-clip
        pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]
        pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]
        ${themeOverlaySurfaceClasses} text-foreground
        shadow-(--shadow-overlay) outline-none
    `,
    {
        variants: {
            side: {
                top: "border-b border-border",
                right: "border-l border-border",
                bottom: "border-t border-border",
                left: "border-r border-border"
            }
        },
        defaultVariants: {
            side: "right"
        }
    }
);

export const sheetHeaderVariants = cva(`flex shrink-0 items-start gap-3 p-4`);

export const sheetTitleVariants = cva(`text-lg font-semibold leading-none tracking-tight`);

export const sheetDescriptionVariants = cva(`mt-1.5 text-sm text-muted-foreground`);

export const sheetContentVariants = cva(
    `
        min-w-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
    `
);

/** 2.75rem keeps the close button at the WCAG 2.5.5 minimum target size. */
export const sheetCloseButtonVariants = cva(`min-h-11 min-w-11 shrink-0`);

export type SheetVariantProps = VariantProps<typeof sheetBaseVariants>;
export type SheetVariantInput = VariantInputs<SheetVariantProps>;
