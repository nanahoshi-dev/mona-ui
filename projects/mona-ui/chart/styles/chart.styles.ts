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
    "absolute text-xs text-muted-foreground select-none pointer-events-none whitespace-nowrap"
);

export const chartLegendBaseThemeVariants = cva("flex flex-wrap items-center gap-4 text-xs select-none", {
    variants: {
        position: {
            bottom: "justify-center mt-2",
            left: "flex-col justify-center mr-2",
            right: "flex-col justify-center ml-2",
            top: "justify-center mb-2"
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

export const chartSeriesHostBaseThemeVariants = cva("hidden");

export type ChartBaseVariantProps = VariantProps<typeof chartBaseThemeVariants>;
export type ChartLegendBaseVariantProps = VariantProps<typeof chartLegendBaseThemeVariants>;
export type ChartLegendItemBaseVariantProps = VariantProps<typeof chartLegendItemBaseThemeVariants>;
