export interface MonaChartMessages {
    /** Joins the parts of a screen reader announcement (", " in English). */
    readonly announcementSeparator: string;
    /** Announced when a keyboard brush is committed. */
    readonly brushApplied: (count: number) => string;
    /** Announced when a keyboard brush is canceled. */
    readonly brushCleared: string;
    /** Announced while a keyboard brush is extended. */
    readonly brushRange: (from: string, to: string) => string;
    /** The data table's first column header when the X axis has no title. */
    readonly category: string;
    /** The name of a radar category without a value. */
    readonly categoryFallbackName: (index: number) => string;
    /** The category range of a Cartesian chart, in its description. */
    readonly categoryRange: (from: string, to: string) => string;
    /** The tooltip label for a waterfall change step or a financial point's price change. */
    readonly change: string;
    /** The price change in a financial announcement. */
    readonly changeValue: (change: string) => string;
    /** The chart's accessible name when it has neither an `ariaLabel` nor a title. */
    readonly chart: string;
    /** The accessible name of the legend. */
    readonly chartLegend: string;
    /** What screen readers call the chart (`aria-roledescription`). */
    readonly chartRoleDescription: string;
    /** The tooltip label for a candlestick or OHLC point's closing price. */
    readonly close: string;
    /** The short closing price label in a tooltip that lists several financial series ("C" in English). */
    readonly closeAbbreviation: string;
    /** The name of a heatmap color legend whose scale has no title, in its accessible name. */
    readonly colorScale: string;
    /** The tooltip label for a funnel stage's conversion rate. */
    readonly conversion: string;
    /** A funnel stage's conversion from the previous stage, in an announcement. */
    readonly conversionOfPrevious: (rate: string) => string;
    /** Below the data table when it shows only the first rows. */
    readonly dataTableTruncated: (shown: number, total: number) => string;
    /** The waterfall legend's name for falling steps. */
    readonly decrease: string;
    /** Announced for a waterfall step that lowers the running total. */
    readonly decreaseAnnouncement: (delta: string, from: string, to: string) => string;
    /** The accessible name of a diverging heatmap color legend, with its minimum, midpoint and maximum. */
    readonly divergingRangeDescription: (
        title: string,
        minimum: string,
        midpoint: string,
        maximum: string
    ) => string;
    /** The tooltip label for a funnel stage's drop-off from the previous stage. */
    readonly dropOff: string;
    /** A funnel stage's drop-off from the previous stage, in an announcement. */
    readonly dropOffValue: (value: string) => string;
    /** Names a falling candlestick or OHLC point, in the tooltip and in announcements. */
    readonly falling: string;
    /** A gauge's scale, in an announcement. */
    readonly gaugeRange: (minimum: string, maximum: string) => string;
    /** The tooltip label for a candlestick or OHLC point's high price. */
    readonly high: string;
    /** The short high price label in a tooltip that lists several financial series ("H" in English). */
    readonly highAbbreviation: string;
    /** The waterfall legend's name for rising steps. */
    readonly increase: string;
    /** Announced for a waterfall step that raises the running total. */
    readonly increaseAnnouncement: (delta: string, from: string, to: string) => string;
    /** Announced when the keyboard deselects a point. */
    readonly itemDeselected: (item: string) => string;
    /** The name of a pie, donut, rose or radial bar item without a category. */
    readonly itemFallbackName: (index: number) => string;
    /** Announced when the keyboard selects a point. */
    readonly itemSelected: (item: string) => string;
    /** The keyboard instructions at the end of the chart's description. */
    readonly keyboardHelp: string;
    /** Separates a label from its value in the tooltip (":" in English). */
    readonly labelValueSeparator: string;
    /** Pairs a label with a value in an announcement, such as a series name with the point's values. */
    readonly labeledValue: (label: string, value: string) => string;
    /** The tooltip label for a candlestick or OHLC point's low price. */
    readonly low: string;
    /** The short low price label in a tooltip that lists several financial series ("L" in English). */
    readonly lowAbbreviation: string;
    /** The waterfall legend's name for unchanged steps. */
    readonly noChange: string;
    /** Announced for a waterfall step that leaves the running total unchanged. */
    readonly noChangeAnnouncement: (value: string) => string;
    /** Shown and included in the chart's description when it has no data and no `noData` template. */
    readonly noData: string;
    /** A candlestick or OHLC point's prices, in an announcement. */
    readonly ohlcValues: (open: string, high: string, low: string, close: string) => string;
    /** The tooltip label for a candlestick or OHLC point's opening price. */
    readonly open: string;
    /** The short opening price label in a tooltip that lists several financial series ("O" in English). */
    readonly openAbbreviation: string;
    /** The tooltip label for a funnel stage's conversion from the first stage. */
    readonly overall: string;
    /** A funnel stage's conversion from the first stage, in an announcement. */
    readonly overallConversion: (rate: string) => string;
    /** Announced when the keyboard pans the viewport down. */
    readonly pannedDown: string;
    /** Announced when the keyboard pans the viewport left. */
    readonly pannedLeft: string;
    /** Announced when the keyboard pans the viewport right. */
    readonly pannedRight: string;
    /** Announced when the keyboard pans the viewport up. */
    readonly pannedUp: string;
    /** Joins a treemap node's path (" / " in English). */
    readonly pathSeparator: string;
    /** A point's position among the points it is navigated with, in an announcement. */
    readonly pointPosition: (position: number, total: number) => string;
    /** The tooltip label for a radial point's minimum-to-maximum range. */
    readonly range: string;
    /**
     * Describes a range with its title, minimum and maximum: a range point in an announcement, or a heatmap color
     * legend in its accessible name.
     */
    readonly rangeDescription: (
        title: string,
        minimum: string,
        maximum: string
    ) => string;
    /** A range value, in an announcement. */
    readonly rangeValue: (from: string, to: string) => string;
    /** Names a rising candlestick or OHLC point, in the tooltip and in announcements. */
    readonly rising: string;
    /** The tooltip label for a waterfall step's running total. */
    readonly runningTotal: string;
    /** The name of a series without a name. */
    readonly seriesFallbackName: (index: number) => string;
    /** Announced when a legend item hides a series or item. */
    readonly seriesHidden: (series: string) => string;
    /** Announced when a legend item shows a series or item. */
    readonly seriesShown: (series: string) => string;
    /** The series of the chart, in its description. */
    readonly seriesSummary: (count: number, names: string) => string;
    /** A series' lowest and highest value, in the chart's description. */
    readonly seriesValueRange: (series: string, minimum: string, maximum: string) => string;
    /** A treemap node's share of the whole, in an announcement. */
    readonly shareOfTotal: (share: string) => string;
    /** The tooltip label for a bubble's size. */
    readonly size: string;
    /** A bubble's size, in an announcement. */
    readonly sizeValue: (size: string) => string;
    /** A point's share of its 100% stack, in an announcement. */
    readonly stackShare: (share: string) => string;
    /** The name of a funnel stage without a category. */
    readonly stageFallbackName: (index: number) => string;
    /** A funnel stage's position among the stages, in an announcement. */
    readonly stagePosition: (position: number, total: number) => string;
    /** The name of a waterfall step without a category. */
    readonly stepFallbackName: (index: number) => string;
    /** A waterfall step's position among the steps, in an announcement. */
    readonly stepPosition: (position: number, total: number) => string;
    /** The waterfall legend's name for subtotal steps. */
    readonly subtotal: string;
    /** Announced for a waterfall subtotal step. */
    readonly subtotalAnnouncement: (value: string) => string;
    /** The waterfall legend's name for total steps. */
    readonly total: string;
    /** Announced for a waterfall total step. */
    readonly totalAnnouncement: (value: string) => string;
    /** A treemap group, in an announcement. */
    readonly treemapGroup: (count: number) => string;
    /** A treemap leaf, in an announcement. */
    readonly treemapLeaf: string;
    /** Names a candlestick or OHLC point that closed at its opening price, in the tooltip and in announcements. */
    readonly unchanged: string;
    /** The tooltip label for a point's value. */
    readonly value: string;
    /** A range value in the tooltip ("10 – 20" in English). */
    readonly valueRange: (from: string, to: string) => string;
    /** Announced when the keyboard resets the viewport to its configured default range. */
    readonly viewportResetToDefault: string;
    /** Announced when the keyboard resets the viewport to the full data range, when no default range is configured. */
    readonly viewportResetToFull: string;
    /** Shown and announced when a gauge value lies outside the gauge's scale and its indicator stops at the edge. */
    readonly visualIndicatorClamped: string;
    /** Announced when the keyboard zooms the viewport in. */
    readonly zoomedIn: string;
    /** Announced when the keyboard zooms the viewport out. */
    readonly zoomedOut: string;
}
