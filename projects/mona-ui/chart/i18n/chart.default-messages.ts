// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaChartMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const CHART_DEFAULT_MESSAGES: MonaChartMessages = {
    announcementSeparator: ", ",
    brushApplied: (count: number) =>
        count === 1
            ? `Brush applied, ${localizeNumber(count)} point`
            : `Brush applied, ${localizeNumber(count)} points`,
    brushCleared: "Brush cleared",
    brushRange: (from: string, to: string) => `Brush from ${from} to ${to}`,
    category: "Category",
    categoryFallbackName: (index: number) => `Category ${localizeNumber(index)}`,
    categoryRange: (from: string, to: string) => `From ${from} to ${to}.`,
    change: "Change",
    changeValue: (change: string) => `change ${change}`,
    chart: "Chart",
    chartLegend: "Chart legend",
    chartRoleDescription: "chart",
    close: "Close",
    closeAbbreviation: "C",
    colorScale: "Color scale",
    conversion: "Conversion",
    conversionOfPrevious: (rate: string) => `Conversion ${rate} of previous stage`,
    dataTableTruncated: (shown: number, total: number) =>
        `Showing the first ${localizeNumber(shown)} of ${localizeNumber(total)} rows.`,
    decrease: "Decrease",
    decreaseAnnouncement: (delta: string, from: string, to: string) =>
        `decrease ${delta}, running total ${from} to ${to}`,
    divergingRangeDescription: (title: string, minimum: string, midpoint: string, maximum: string) =>
        `${title}, ${minimum} to ${midpoint} to ${maximum}`,
    dropOff: "Drop-off",
    dropOffValue: (value: string) => `Drop-off ${value}`,
    falling: "Falling",
    gaugeRange: (minimum: string, maximum: string) => `range ${minimum} to ${maximum}`,
    high: "High",
    highAbbreviation: "H",
    increase: "Increase",
    increaseAnnouncement: (delta: string, from: string, to: string) =>
        `increase ${delta}, running total ${from} to ${to}`,
    itemDeselected: (item: string) => `${item}, deselected`,
    itemFallbackName: (index: number) => `Item ${localizeNumber(index)}`,
    itemSelected: (item: string) => `${item}, selected`,
    keyboardHelp:
        "Use the arrow keys to move between data points, Home and End to jump to the first and last, Enter or Space to activate, and Escape to clear.",
    labelValueSeparator: ":",
    labeledValue: (label: string, value: string) => `${label}: ${value}`,
    low: "Low",
    lowAbbreviation: "L",
    noChange: "No Change",
    noChangeAnnouncement: (value: string) => `no change, running total ${value}`,
    noData: "No data available",
    ohlcValues: (open: string, high: string, low: string, close: string) =>
        `Open ${open}, high ${high}, low ${low}, close ${close}`,
    open: "Open",
    openAbbreviation: "O",
    overall: "Overall",
    overallConversion: (rate: string) => `Overall conversion ${rate}`,
    pannedDown: "Panned down",
    pannedLeft: "Panned left",
    pannedRight: "Panned right",
    pannedUp: "Panned up",
    pathSeparator: " / ",
    pointPosition: (position: number, total: number) => `${localizeNumber(position)} of ${localizeNumber(total)}`,
    range: "Range",
    rangeDescription: (title: string, minimum: string, maximum: string) => `${title}, ${minimum} to ${maximum}`,
    rangeValue: (from: string, to: string) => `${from} to ${to}`,
    rising: "Rising",
    runningTotal: "Running Total",
    seriesFallbackName: (index: number) => `Series ${localizeNumber(index)}`,
    seriesHidden: (series: string) => `${series} hidden`,
    seriesShown: (series: string) => `${series} shown`,
    seriesSummary: (count: number, names: string) =>
        count === 1 ? `One series: ${names}.` : `${localizeNumber(count)} series: ${names}.`,
    seriesValueRange: (series: string, minimum: string, maximum: string) =>
        `${series}: lowest ${minimum}, highest ${maximum}.`,
    shareOfTotal: (share: string) => `${share} of total`,
    size: "size",
    sizeValue: (size: string) => `size ${size}`,
    stackShare: (share: string) => `stack share ${share}`,
    stageFallbackName: (index: number) => `Stage ${localizeNumber(index)}`,
    stagePosition: (position: number, total: number) => `stage ${localizeNumber(position)} of ${localizeNumber(total)}`,
    stepFallbackName: (index: number) => `Step ${localizeNumber(index)}`,
    stepPosition: (position: number, total: number) => `step ${localizeNumber(position)} of ${localizeNumber(total)}`,
    subtotal: "Subtotal",
    subtotalAnnouncement: (value: string) => `subtotal ${value}`,
    total: "Total",
    totalAnnouncement: (value: string) => `total ${value}`,
    treemapGroup: (count: number) =>
        count === 1 ? `Group (${localizeNumber(count)} child)` : `Group (${localizeNumber(count)} children)`,
    treemapLeaf: "Leaf",
    unchanged: "Unchanged",
    value: "Value",
    valueRange: (from: string, to: string) => `${from} – ${to}`,
    viewportResetToDefault: "Viewport reset to default range",
    viewportResetToFull: "Viewport reset to full range",
    visualIndicatorClamped: "Visual indicator clamped",
    zoomedIn: "Zoomed in",
    zoomedOut: "Zoomed out"
};
