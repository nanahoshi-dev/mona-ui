import { cva } from "class-variance-authority";

/**
 * A sparkline is word-sized: it sits on a line of text, or in a table cell. Its colors are custom properties, so a
 * class or a style can set them: `--mona-sparkline-color` for the line, the area and the bars, the first chart color by
 * default, and `--mona-sparkline-negative-color` for bars below zero, the error color by default.
 *
 * With markers, the padding keeps their dots, which are wider than the line, inside the box.
 */
export const sparklineBaseThemeVariants = cva(
    `
        relative inline-block h-6 w-24 shrink-0 align-middle
        [--mona-sparkline-color:var(--color-chart-1)] [--mona-sparkline-negative-color:var(--color-error)]
    `,
    {
        variants: {
            markers: {
                true: "p-[3px]",
                false: ""
            }
        },
        defaultVariants: {
            markers: false
        }
    }
);

/**
 * The drawing fills the box. In forced colors, it keeps the colors set here, in the system's text color, whatever the
 * sparkline's own: bars below zero still stand apart by being below the middle.
 */
export const SPARKLINE_SVG_CLASSES = `
    block size-full overflow-visible forced-color-adjust-none
    forced-colors:[--mona-sparkline-color:CanvasText] forced-colors:[--mona-sparkline-negative-color:CanvasText]
`;

export const SPARKLINE_LINE_CLASSES =
    "fill-none stroke-(--mona-sparkline-color) [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5px]";

/** The area under the line is a wash of its color: the line carries the shape. */
export const SPARKLINE_AREA_CLASSES = "fill-(--mona-sparkline-color) stroke-none [fill-opacity:0.2]";

/** Dots: segments of no length with round caps, as wide as the stroke. */
export const SPARKLINE_DOT_CLASSES =
    "fill-none stroke-(--mona-sparkline-color) [stroke-linecap:round] [stroke-width:5px]";

export const SPARKLINE_BAR_CLASSES = {
    negative: "fill-(--mona-sparkline-negative-color)",
    positive: "fill-(--mona-sparkline-color)",
    zero: "fill-muted-foreground forced-colors:fill-[CanvasText]"
} as const;

export const SPARKLINE_REFERENCE_CLASSES =
    "fill-none stroke-muted-foreground [stroke-dasharray:3_2] [stroke-width:1px] forced-colors:stroke-[GrayText]";

export const SPARKLINE_BASELINE_CLASSES = "fill-none stroke-border [stroke-width:1px] forced-colors:stroke-[GrayText]";
