/**
 * How a line or an area sparkline joins its values, as a chart's line series does: `"linear"` with straight segments,
 * `"monotone-x"` with a smooth curve that never swings past the values, `"natural"` with a smoother curve that can,
 * `"step"` in steps that change halfway between values, and `"step-after"` in steps that hold each value until the
 * next one.
 */
export type SparklineCurve = "linear" | "monotone-x" | "natural" | "step" | "step-after";
