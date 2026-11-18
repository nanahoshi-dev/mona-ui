import type { Column } from "../models/Column";
import type { ColumnGroup } from "../models/ColumnGroup";
import type { GridLayoutColumn, GridLayoutDataColumn } from "../models/GridLayoutColumn";
import type { GridStickyState } from "../models/GridStickyState";

type GroupedColumn = Pick<Column, "groups" | "hidden" | "id">;

/** A cell of a header row above the column headers. */
export type GridHeaderGroupCell = GridHeaderGroupSpacerCell | GridHeaderGroupTitleCell;

/** The space above a column that isn't in a group at that level; it continues the column's header upwards. */
export interface GridHeaderGroupSpacerCell {
    readonly key: string;
    readonly kind: "spacer";
    /** The layout column the space is above, whose sticky state it follows. */
    readonly layoutKey: string;
    readonly width: number | null;
}

/** A group's header, over the group's columns that sit next to each other. */
export interface GridHeaderGroupTitleCell {
    /** The `aria-colindex` of its first column. */
    readonly ariaColIndex: number;
    /** The keyboard-navigation index of its first column. */
    readonly colIndex: number;
    /** How many columns it spans. */
    readonly colSpan: number;
    /** Whether ArrowLeft (inline-start) stops at this cell. */
    readonly firstInRow: boolean;
    readonly group: ColumnGroup;
    /** Unique in the header, also when locking splits a group's columns. */
    readonly key: string;
    readonly kind: "group";
    /** Whether ArrowRight (inline-end) stops at this cell. */
    readonly lastInRow: boolean;
    readonly sticky: GridStickyState | null;
    /** The sum of its columns' widths, or `null` while one of them isn't measured. */
    readonly width: number | null;
}

/** Columns that move as one among their siblings: a single column, or the columns of a nested group. */
export interface GridColumnRun {
    /** The index after its last column. */
    readonly end: number;
    readonly start: number;
}

/**
 * Builds the header rows above the column headers, outermost group first. A group's columns that sit next to each
 * other share one cell. Locking can move some of a group's columns away from the others; each part then has a cell.
 */
export function buildHeaderGroupRows(layout: readonly GridLayoutColumn[]): GridHeaderGroupCell[][] {
    const depth = getColumnGroupDepth(
        layout.flatMap(layoutColumn => (layoutColumn.kind === "column" ? [layoutColumn.column] : []))
    );
    const rows: GridHeaderGroupCell[][] = [];
    for (let level = 0; level < depth; level++) {
        const row: (GridHeaderGroupCell | Omit<GridHeaderGroupTitleCell, "firstInRow" | "lastInRow">)[] = [];
        let run: GridLayoutDataColumn[] = [];
        let runGroup: ColumnGroup | null = null;
        let runStart = 0;
        const closeRun = (): void => {
            if (runGroup != null && run.length !== 0) {
                row.push(createTitleCell(runGroup, run, runStart));
            }
            run = [];
            runGroup = null;
        };
        for (const [index, layoutColumn] of layout.entries()) {
            const group = layoutColumn.kind === "column" ? getColumnGroups(layoutColumn.column)[level] : undefined;
            if (layoutColumn.kind !== "column" || group == null) {
                closeRun();
                row.push({
                    key: `spacer:${layoutColumn.key}`,
                    kind: "spacer",
                    layoutKey: layoutColumn.key,
                    width: layoutColumn.width
                });
                continue;
            }
            // A cell is sticky or not as a whole, so the group's pinned columns get a cell of their own.
            if (runGroup?.id !== group.id || run.at(-1)?.sticky?.side !== layoutColumn.sticky?.side) {
                closeRun();
                runGroup = group;
                runStart = index;
            }
            run.push(layoutColumn);
        }
        closeRun();
        const titleIndices = row.flatMap((cell, index) => (cell.kind === "group" ? [index] : []));
        rows.push(
            row.map((cell, index) =>
                cell.kind === "group"
                    ? { ...cell, firstInRow: index === titleIndices[0], lastInRow: index === titleIndices.at(-1) }
                    : cell
            )
        );
    }
    return rows;
}

/** How many group rows the header needs: the deepest nesting among the columns. */
export function getColumnGroupDepth(columns: Iterable<Pick<Column, "groups">>): number {
    let depth = 0;
    for (const column of columns) {
        depth = Math.max(depth, getColumnGroups(column).length);
    }
    return depth;
}

/** The groups a column sits in, outermost first. */
export function getColumnGroups(column: Pick<Column, "groups">): readonly ColumnGroup[] {
    return column.groups ?? [];
}

/**
 * Where a keyboard move takes a column: past the next sibling run in the step's direction that has a visible column.
 * Returns the index to insert it before and the visible column it passes, or `null` at the end of its group.
 */
export function getColumnStepTarget<T extends GroupedColumn>(
    columns: readonly T[],
    column: T,
    step: -1 | 1
): { readonly beforeIndex: number; readonly neighbor: T } | null {
    const index = columns.findIndex(candidate => candidate.id === column.id);
    if (index < 0) {
        return null;
    }
    const runs = getSiblingRuns(columns, columns[index]);
    const ownRun = runs.findIndex(run => run.start <= index && index < run.end);
    for (let runIndex = ownRun + step; runIndex >= 0 && runIndex < runs.length; runIndex += step) {
        const run = runs[runIndex];
        const visible = columns.slice(run.start, run.end).filter(candidate => !candidate.hidden);
        if (visible.length === 0) {
            continue;
        }
        return step === 1
            ? { beforeIndex: run.end, neighbor: visible[visible.length - 1] }
            : { beforeIndex: run.start, neighbor: visible[0] };
    }
    return null;
}

/**
 * The runs a column moves among: its siblings in its innermost group, or the top-level columns and groups when it
 * isn't in one. A nested group's columns form one run.
 */
export function getSiblingRuns(
    columns: readonly Pick<Column, "groups" | "id">[],
    column: Pick<Column, "groups">
): GridColumnRun[] {
    const parents = getColumnGroups(column);
    const depth = parents.length;
    const runs: GridColumnRun[] = [];
    let current: { readonly key: string; readonly start: number } | null = null;
    for (const [index, candidate] of columns.entries()) {
        const groups = getColumnGroups(candidate);
        const sibling = groups.length >= depth && parents.every((group, level) => groups[level].id === group.id);
        const key = sibling ? (groups[depth]?.id ?? `column:${candidate.id}`) : null;
        if (current != null && current.key !== key) {
            runs.push({ end: index, start: current.start });
            current = null;
        }
        if (key != null && current == null) {
            current = { key, start: index };
        }
    }
    if (current != null) {
        runs.push({ end: columns.length, start: current.start });
    }
    return runs;
}

/**
 * Puts the columns of each group next to each other, where the group's first column is, and keeps their order
 * otherwise. Columns outside groups keep their places.
 */
export function orderColumnsByGroup<T extends Pick<Column, "groups" | "id">>(columns: readonly T[]): T[] {
    return columns.some(column => getColumnGroups(column).length !== 0) ? clusterColumns(columns, 0) : [...columns];
}

/**
 * Where a column can go when it's moved to just before `beforeIndex`: that place when it keeps the column among its
 * siblings and doesn't split a group, the nearest such place past hidden columns only, or `null`.
 */
export function resolveColumnMoveIndex(
    columns: readonly GroupedColumn[],
    column: GroupedColumn,
    beforeIndex: number
): number | null {
    const boundaries = new Set(getSiblingRuns(columns, column).flatMap(run => [run.start, run.end]));
    if (boundaries.has(beforeIndex)) {
        return beforeIndex;
    }
    for (let index = beforeIndex; index > 0 && columns[index - 1].hidden;) {
        index--;
        if (boundaries.has(index)) {
            return index;
        }
    }
    for (let index = beforeIndex; index < columns.length && columns[index].hidden;) {
        index++;
        if (boundaries.has(index)) {
            return index;
        }
    }
    return null;
}

function clusterColumns<T extends Pick<Column, "groups" | "id">>(columns: readonly T[], depth: number): T[] {
    const runs = new Map<string, T[]>();
    for (const column of columns) {
        const group = getColumnGroups(column)[depth];
        const key = group == null ? `column:${column.id}` : `group:${group.id}`;
        const run = runs.get(key);
        if (run == null) {
            runs.set(key, [column]);
        } else {
            run.push(column);
        }
    }
    const ordered: T[] = [];
    for (const [key, run] of runs) {
        ordered.push(...(key.startsWith("group:") ? clusterColumns(run, depth + 1) : run));
    }
    return ordered;
}

function createTitleCell(
    group: ColumnGroup,
    run: readonly GridLayoutDataColumn[],
    layoutIndex: number
): Omit<GridHeaderGroupTitleCell, "firstInRow" | "lastInRow"> {
    const first = run[0];
    const last = run[run.length - 1];
    const widths = run.map(layoutColumn => layoutColumn.width);
    const side = first.sticky?.side ?? null;
    let sticky: GridStickyState | null = null;
    if (side != null) {
        sticky = {
            edge: run.some(layoutColumn => layoutColumn.sticky?.edge === true),
            // A start-pinned cell sits where its first column does; an end-pinned one where its last column does.
            offset: (side === "start" ? first.sticky?.offset : last.sticky?.offset) ?? 0,
            side
        };
    }
    return {
        ariaColIndex: layoutIndex + 1,
        colIndex: first.logicalIndex,
        colSpan: run.length,
        group,
        key: `group:${group.id}:${first.key}`,
        kind: "group",
        sticky,
        width: widths.every(width => width != null)
            ? widths.reduce<number>((total, width) => total + (width ?? 0), 0)
            : null
    };
}
