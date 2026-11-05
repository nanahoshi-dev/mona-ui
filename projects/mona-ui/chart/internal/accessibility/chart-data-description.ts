import type { MonaChartMessages } from "@nanahoshi/mona-ui/i18n";
import type { ChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { formatChartNumber } from "../utils/chart-locale";

/** The most rows the visually hidden data table renders; a note gives the total when there are more. */
export const CHART_DATA_TABLE_ROW_LIMIT = 100;

export interface ChartDataTableRow {
    readonly cells: readonly string[];
    readonly label: string;
}

export interface ChartDataTableModel {
    readonly columns: readonly string[];
    readonly rows: readonly ChartDataTableRow[];
    readonly totalRows: number;
}

interface SeriesHits {
    readonly hits: SceneHitTarget[];
    readonly name: string;
}

function isTreemap(scene: ChartScene): boolean {
    return scene.coordinateSystem === "hierarchical";
}

function isHeatmap(scene: ChartScene): boolean {
    return scene.coordinateSystem === "cartesian" && scene.cartesianKind === "heatmap";
}

/** The label of a point along the category or X dimension. */
function categoryLabel(hit: SceneHitTarget, messages: MonaChartMessages): string {
    if (hit.hierarchy) {
        return hit.hierarchy.formattedPath.join(messages.pathSeparator);
    }
    const label = hit.formattedCategory ?? hit.formattedXValue ?? hit.category ?? hit.xValue;
    return label === undefined || label === null ? "" : String(label);
}

/** The value of a point as the chart shows it. */
function valueLabel(hit: SceneHitTarget, messages: MonaChartMessages): string {
    if (hit.hierarchy) {
        return hit.hierarchy.formattedValue;
    }
    if (hit.formattedValue) {
        return hit.formattedValue;
    }
    const from = hit.formattedFrom ?? hit.range?.formattedFrom;
    const to = hit.formattedTo ?? hit.range?.formattedTo;
    if (from && to) {
        return messages.valueRange(from, to);
    }
    return typeof hit.yValue === "number" ? formatChartNumber(hit.yValue) : "";
}

function groupBySeries(scene: ChartScene): SeriesHits[] {
    const bySeries = new Map<string, SeriesHits>();
    for (const hit of scene.hitTargets) {
        let entry = bySeries.get(hit.seriesId);
        if (!entry) {
            entry = { hits: [], name: hit.seriesName };
            bySeries.set(hit.seriesId, entry);
        }
        entry.hits.push(hit);
    }
    return [...bySeries.values()];
}

/**
 * Describes the chart's data in a few sentences: the series, the category range of a Cartesian chart, and each
 * series' lowest and highest value, as formatted for display.
 */
export function describeChartData(scene: ChartScene, messages: MonaChartMessages): string[] {
    if (!scene.hasRenderableData || scene.hitTargets.length === 0) {
        return [messages.noData];
    }
    const series = groupBySeries(scene);
    const parts = [messages.seriesSummary(series.length, series.map(s => s.name).join(messages.announcementSeparator))];

    if (scene.coordinateSystem === "cartesian" && !isHeatmap(scene)) {
        const first = series[0].hits;
        const from = categoryLabel(first[0], messages);
        const to = categoryLabel(first[first.length - 1], messages);
        if (from && to && from !== to) {
            parts.push(messages.categoryRange(from, to));
        }
    }

    if (!isTreemap(scene)) {
        for (const entry of series) {
            let lowest: SceneHitTarget | null = null;
            let highest: SceneHitTarget | null = null;
            for (const hit of entry.hits) {
                if (typeof hit.yValue !== "number" || !Number.isFinite(hit.yValue)) {
                    continue;
                }
                if (!lowest || hit.yValue < (lowest.yValue as number)) {
                    lowest = hit;
                }
                if (!highest || hit.yValue > (highest.yValue as number)) {
                    highest = hit;
                }
            }
            if (lowest && highest) {
                parts.push(
                    messages.seriesValueRange(entry.name, valueLabel(lowest, messages), valueLabel(highest, messages))
                );
            }
        }
    }
    return parts;
}

/**
 * Builds the visually hidden data table: a row per category (or X value, heatmap column or treemap node) and a
 * column per series (or heatmap row), at most {@link CHART_DATA_TABLE_ROW_LIMIT} rows.
 */
export function buildChartDataTable(
    scene: ChartScene,
    messages: MonaChartMessages,
    categoryTitle: string,
    rowLimit: number = CHART_DATA_TABLE_ROW_LIMIT
): ChartDataTableModel | null {
    if (!scene.hasRenderableData || scene.hitTargets.length === 0) {
        return null;
    }
    const heatmap = isHeatmap(scene);
    const columnKeys: string[] = [];
    const columnIndex = new Map<string, number>();
    const rowKeys: string[] = [];
    const cellsByRow = new Map<string, Map<number, string>>();

    for (const hit of scene.hitTargets) {
        const columnKey = heatmap
            ? String(hit.formattedYCategory ?? hit.categoryY ?? hit.seriesName)
            : isTreemap(scene)
              ? messages.value
              : hit.seriesName;
        let column = columnIndex.get(columnKey);
        if (column === undefined) {
            column = columnKeys.length;
            columnKeys.push(columnKey);
            columnIndex.set(columnKey, column);
        }
        const rowKey = categoryLabel(hit, messages);
        let cells = cellsByRow.get(rowKey);
        if (!cells) {
            cells = new Map();
            cellsByRow.set(rowKey, cells);
            rowKeys.push(rowKey);
        }
        if (!cells.has(column)) {
            cells.set(column, valueLabel(hit, messages));
        }
    }

    const rows = rowKeys.slice(0, rowLimit).map(key => {
        const cells = cellsByRow.get(key) as Map<number, string>;
        return { cells: columnKeys.map((_, i) => cells.get(i) ?? ""), label: key };
    });
    return { columns: [categoryTitle || messages.category, ...columnKeys], rows, totalRows: rowKeys.length };
}
