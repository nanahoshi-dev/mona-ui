export interface MonaChartMessages {
    readonly change: string;
    readonly chart: string;
    readonly chartLegend: string;
    readonly close: string;
    readonly closeAbbreviation: string;
    readonly colorScale: string;
    readonly conversion: string;
    readonly divergingRangeDescription: (
        title: string,
        minimum: string,
        midpoint: string,
        maximum: string
    ) => string;
    readonly dropOff: string;
    readonly falling: string;
    readonly high: string;
    readonly highAbbreviation: string;
    readonly low: string;
    readonly lowAbbreviation: string;
    readonly noData: string;
    readonly open: string;
    readonly openAbbreviation: string;
    readonly overall: string;
    readonly range: string;
    readonly rangeDescription: (
        title: string,
        minimum: string,
        maximum: string
    ) => string;
    readonly rising: string;
    readonly runningTotal: string;
    readonly size: string;
    readonly unchanged: string;
    readonly value: string;
    readonly visualIndicatorClamped: string;
}
