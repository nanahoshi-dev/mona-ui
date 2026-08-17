import { cva, type VariantProps } from "class-variance-authority";

export const chartBaseThemeVariants = cva(
    "relative block select-none h-80 w-full outline-none focus-visible:ring-2 focus-visible:ring-focus-indicator/35 focus-visible:ring-offset-1 focus-visible:ring-offset-surface cursor-default",
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
    "absolute text-xs text-muted-foreground select-none pointer-events-none whitespace-nowrap transition-[left,top,opacity] motion-reduce:transition-none duration-[var(--mona-chart-animation-duration,300ms)] ease-[var(--mona-chart-animation-easing,cubic-bezier(0,0,0.2,1))]"
);

export const chartLegendBaseThemeVariants = cva("flex flex-wrap items-center gap-4 text-xs select-none", {
    variants: {
        position: {
            // min-h-5 reserves a single item row (matches
            // chartLegendItemBaseThemeVariants' text-xs + py-0.5 height) so
            // the plot area doesn't resize when the legend goes from empty
            // to non-empty (or vice versa), which would otherwise shift the
            // X axis vertically as the last/first series is toggled.
            bottom: "justify-center mt-3 min-h-5",
            left: "flex-col justify-center mr-4",
            right: "flex-col justify-center ml-4",
            top: "justify-center mb-2 min-h-5"
        }
    }
});

export const chartLegendItemBaseThemeVariants = cva(
    "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-opacity duration-150 outline-none focus-visible:ring-1 focus-visible:ring-focus-indicator/35",
    {
        variants: {
            interactive: {
                false: "cursor-default",
                true: "cursor-pointer hover:bg-hover active:bg-active"
            },
            visible: {
                false: "opacity-40 line-through",
                true: "opacity-100"
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

export type ChartBaseVariantProps = VariantProps<typeof chartBaseThemeVariants>;
export type ChartLegendBaseVariantProps = VariantProps<typeof chartLegendBaseThemeVariants>;
export type ChartLegendItemBaseVariantProps = VariantProps<typeof chartLegendItemBaseThemeVariants>;
