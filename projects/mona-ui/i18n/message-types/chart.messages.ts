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
    readonly change: string;
    /** The price change in a financial announcement. */
    readonly changeValue: (change: string) => string;
    readonly chart: string;
    readonly chartLegend: string;
    /** What screen readers call the chart (`aria-roledescription`). */
    readonly chartRoleDescription: string;
    readonly close: string;
    readonly closeAbbreviation: string;
    readonly colorScale: string;
    readonly conversion: string;
    /** A funnel stage's conversion from the previous stage, in an announcement. */
    readonly conversionOfPrevious: (rate: string) => string;
    /** Below the data table when it shows only the first rows. */
    readonly dataTableTruncated: (shown: number, total: number) => string;
    /** The waterfall legend's name for falling steps. */
    readonly decrease: string;
    readonly decreaseAnnouncement: (delta: string, from: string, to: string) => string;
    readonly divergingRangeDescription: (
        title: string,
        minimum: string,
        midpoint: string,
        maximum: string
    ) => string;
    readonly dropOff: string;
    readonly dropOffValue: (value: string) => string;
    readonly falling: string;
    /** A gauge's scale, in an announcement. */
    readonly gaugeRange: (minimum: string, maximum: string) => string;
    readonly high: string;
    readonly highAbbreviation: string;
    /** The waterfall legend's name for rising steps. */
    readonly increase: string;
    readonly increaseAnnouncement: (delta: string, from: string, to: string) => string;
    readonly itemDeselected: (item: string) => string;
    /** The name of a pie, donut, rose or radial bar item without a category. */
    readonly itemFallbackName: (index: number) => string;
    readonly itemSelected: (item: string) => string;
    /** The keyboard instructions at the end of the chart's description. */
    readonly keyboardHelp: string;
    readonly labelValueSeparator: string;
    readonly labeledValue: (label: string, value: string) => string;
    readonly low: string;
    readonly lowAbbreviation: string;
    /** The waterfall legend's name for unchanged steps. */
    readonly noChange: string;
    readonly noChangeAnnouncement: (value: string) => string;
    readonly noData: string;
    /** A candlestick or OHLC point's prices, in an announcement. */
    readonly ohlcValues: (open: string, high: string, low: string, close: string) => string;
    readonly open: string;
    readonly openAbbreviation: string;
    readonly overall: string;
    readonly overallConversion: (rate: string) => string;
    readonly pannedDown: string;
    readonly pannedLeft: string;
    readonly pannedRight: string;
    readonly pannedUp: string;
    /** Joins a treemap node's path (" / " in English). */
    readonly pathSeparator: string;
    /** A point's position among the points it is navigated with, in an announcement. */
    readonly pointPosition: (position: number, total: number) => string;
    readonly range: string;
    readonly rangeDescription: (
        title: string,
        minimum: string,
        maximum: string
    ) => string;
    /** A range value, in an announcement. */
    readonly rangeValue: (from: string, to: string) => string;
    readonly rising: string;
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
    readonly size: string;
    /** A bubble's size, in an announcement. */
    readonly sizeValue: (size: string) => string;
    /** A point's share of its 100% stack, in an announcement. */
    readonly stackShare: (share: string) => string;
    /** The name of a funnel stage without a category. */
    readonly stageFallbackName: (index: number) => string;
    readonly stagePosition: (position: number, total: number) => string;
    /** The name of a waterfall step without a category. */
    readonly stepFallbackName: (index: number) => string;
    readonly stepPosition: (position: number, total: number) => string;
    /** The waterfall legend's name for subtotal steps. */
    readonly subtotal: string;
    readonly subtotalAnnouncement: (value: string) => string;
    /** The waterfall legend's name for total steps. */
    readonly total: string;
    readonly totalAnnouncement: (value: string) => string;
    /** A treemap group, in an announcement. */
    readonly treemapGroup: (count: number) => string;
    /** A treemap leaf, in an announcement. */
    readonly treemapLeaf: string;
    readonly unchanged: string;
    readonly value: string;
    /** A range value in the tooltip ("10 – 20" in English). */
    readonly valueRange: (from: string, to: string) => string;
    readonly viewportResetToDefault: string;
    readonly viewportResetToFull: string;
    readonly visualIndicatorClamped: string;
    readonly zoomedIn: string;
    readonly zoomedOut: string;
}
