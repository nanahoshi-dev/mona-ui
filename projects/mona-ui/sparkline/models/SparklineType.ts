/**
 * How a sparkline draws its values: `"line"` joins them, `"area"` fills under the line, `"column"` draws a bar for
 * each from zero, and `"win-loss"` draws a bar up for each positive value, down for each negative one and a short tick
 * for each zero, all of one height.
 */
export type SparklineType = "area" | "column" | "line" | "win-loss";
