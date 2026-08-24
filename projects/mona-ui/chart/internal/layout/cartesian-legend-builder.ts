import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartCartesianSeriesRegistration,
    ChartFinancialSeriesRegistration
} from "../context/chart-registration-context";
import { resolveSeriesDisplayName } from "../data/chart-value-resolver";
import type { ChartStyleResolver } from "../style/chart-style-resolver";

export class CartesianLegendBuilder {
    public static buildSeriesItems(
        effectiveSeries: readonly ChartCartesianSeriesRegistration[],
        styleResolver: ChartStyleResolver
    ): ChartLegendItem[] {
        const legendItems: ChartLegendItem[] = [];
        for (let seriesIdx = 0; seriesIdx < effectiveSeries.length; seriesIdx++) {
            const series = effectiveSeries[seriesIdx];
            if (series.type === "candlestick" || series.type === "ohlc") {
                const finStyle = styleResolver.resolveFinancialSeriesStyle(series as ChartFinancialSeriesRegistration);
                const color = finStyle.color || finStyle.risingColor;
                const secondaryColor = finStyle.color ? undefined : finStyle.fallingColor;
                legendItems.push({
                    color,
                    itemId: series.id,
                    kind: "series",
                    name: resolveSeriesDisplayName(series, seriesIdx),
                    secondaryColor,
                    seriesId: series.id,
                    seriesType: series.type,
                    visible: series.visible()
                });
                continue;
            }

            const color =
                series.type === "scatter" || series.type === "bubble"
                    ? styleResolver.resolveMarkerSeriesStyle(series, seriesIdx).color
                    : styleResolver.resolveSeriesStyle(series, seriesIdx).color;

            legendItems.push({
                color,
                itemId: series.id,
                kind: "series",
                name: resolveSeriesDisplayName(series, seriesIdx),
                seriesId: series.id,
                seriesType: series.type,
                visible: series.visible()
            });
        }
        return legendItems;
    }
}
