import { cva, type VariantProps } from "class-variance-authority";

export const chartBaseThemeVariants = cva(
    "relative flex flex-col select-none h-80 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-indicator cursor-default",
    {
        variants: {
            interactive: {
                false: "",
                true: ""
            }
        }
    }
);

export const chartAxisLabelBaseThemeVariants = cva(
    "absolute text-xs text-muted-foreground select-none pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis [unicode-bidi:plaintext] transition-[left,top,opacity] motion-reduce:transition-none duration-[var(--mona-chart-animation-duration,300ms)] ease-[var(--mona-chart-animation-easing,cubic-bezier(0,0,0.2,1))]"
);

export const chartLegendBaseThemeVariants = cva("flex flex-wrap items-center gap-4 text-xs select-none flex-none", {
    variants: {
        position: {
            // min-h-5 reserves a single item row (matches
            // chartLegendItemBaseThemeVariants' text-xs + py-0.5 height) so
            // the plot area doesn't resize when the legend goes from empty
            // to non-empty (or vice versa), which would otherwise shift the
            // X axis vertically as the last/first series is toggled.
            bottom: "justify-center mt-3 min-h-5",
            end: "flex-col justify-center ms-4",
            start: "flex-col justify-center me-4",
            top: "justify-center mb-2 min-h-5"
        }
    }
});

export const chartLegendItemBaseThemeVariants = cva(
    "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator",
    {
        variants: {
            interactive: {
                false: "cursor-default",
                true: "cursor-pointer hover:bg-hover active:bg-active"
            },
            visible: {
                // The name stays at text contrast: a hidden series is a pressed-off toggle, not a disabled control.
                false: "text-muted-foreground line-through [&>[data-mona-chart-export-role=legend-bullet]]:opacity-40",
                true: ""
            }
        }
    }
);

export const chartTooltipBaseThemeVariants = cva(
    "pointer-events-none absolute z-50 max-w-[calc(100%-16px)] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md transition-opacity duration-100"
);

export const chartNoDataBaseThemeVariants = cva(
    "absolute inset-0 flex items-center justify-center text-sm text-muted-foreground select-none"
);

export const chartHeaderBaseThemeVariants = cva("flex flex-col gap-1 mb-3 select-none", {
    variants: {
        align: {
            center: "items-center text-center",
            end: "items-end text-end",
            start: "items-start text-start"
        }
    }
});

export const chartTitleBaseThemeVariants = cva("text-sm font-semibold text-foreground tracking-tight select-none");

export const chartSubtitleBaseThemeVariants = cva("text-xs text-muted-foreground select-none");

export const chartCrosshairLabelBaseThemeVariants = cva(
    "absolute pointer-events-none z-40 rounded border border-border bg-popover px-1.5 py-0.5 text-[11px] font-medium text-popover-foreground shadow-sm select-none whitespace-nowrap [unicode-bidi:plaintext]"
);

export const chartReferenceLabelBaseThemeVariants = cva(
    "absolute pointer-events-none z-30 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground select-none whitespace-nowrap"
);

export const chartAnnotationLabelBaseThemeVariants = cva(
    "absolute pointer-events-none z-30 rounded-md border border-border bg-popover/90 backdrop-blur-xs px-2 py-1 text-xs font-medium text-popover-foreground shadow-sm select-none whitespace-nowrap"
);

export type ChartBaseVariantProps = VariantProps<typeof chartBaseThemeVariants>;
export type ChartHeaderBaseVariantProps = VariantProps<typeof chartHeaderBaseThemeVariants>;
export type ChartLegendBaseVariantProps = VariantProps<typeof chartLegendBaseThemeVariants>;
export type ChartLegendItemBaseVariantProps = VariantProps<typeof chartLegendItemBaseThemeVariants>;
