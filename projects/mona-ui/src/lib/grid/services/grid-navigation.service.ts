import { Injectable, signal } from "@angular/core";
import { ImmutableDictionary } from "@mirei/ts-collections";
import { v4 } from "uuid";

@Injectable()
export class GridNavigationService {
    readonly #cellElementDict = signal(ImmutableDictionary.create<string, NavigationData>());
    readonly #lastFocusedCellKey = signal<string | null>(null);
    readonly #lastFocusedCellSnapshot = signal<NavigationCellSnapshot | null>(null);
    readonly #lastNonGroupCellKey = signal<string | null>(null);

    public focusActiveCellOrFirstHeader(): boolean {
        const focusedCell = this.#getFocusedCell();
        if (focusedCell) {
            this.#focusCell(focusedCell.key, focusedCell.value);
            return true;
        }

        const fallback = this.#findFallbackCell(this.#lastFocusedCellSnapshot());
        if (!fallback) {
            return false;
        }

        this.#focusCell(fallback.key, fallback.value);
        return true;
    }

    public focusFirstCell(): void {
        const firstCell = this.#findFirstHeaderCell() ?? this.#findFirstCell();
        if (firstCell) {
            this.#focusCell(firstCell.key, firstCell.value);
        }
    }

    public isFocused(cellKey: string): boolean {
        return this.#lastFocusedCellKey() === cellKey;
    }

    public navigate(cellKey: string, navigationKey: string): boolean {
        switch (navigationKey) {
            case "ArrowDown":
                return this.#navigateVertically("down", cellKey);
            case "ArrowUp":
                return this.#navigateVertically("up", cellKey);
            case "ArrowLeft":
                return this.#navigateHorizontally("left", cellKey);
            case "ArrowRight":
                return this.#navigateHorizontally("right", cellKey);
            case "Home":
                return this.#navigateToRowEdge("first", cellKey);
            case "End":
                return this.#navigateToRowEdge("last", cellKey);
            case "CtrlHome":
                return this.#navigateToGridEdge("first");
            case "CtrlEnd":
                return this.#navigateToGridEdge("last");
            default:
                return false;
        }
    }

    public registerCell(data: NavigationData): string {
        const cellKey = this.#createCellKey(data);
        const currentData = this.#cellElementDict().get(cellKey);
        if (!currentData || !this.#navigationDataEqual(currentData, data)) {
            this.#cellElementDict.update(dict => dict.put(cellKey, data));
        }
        this.#ensureFocusedCell();
        return cellKey;
    }

    public setLastFocusedCellKey(key: string): void {
        const data = this.#cellElementDict().get(key);
        if (data) {
            this.#setFocusedCell(key, data);
        }
    }

    public unregisterCell(cellKey: string): void {
        const data = this.#cellElementDict().get(cellKey);
        this.#cellElementDict.update(dict => dict.remove(cellKey));
        if (this.#lastFocusedCellKey() !== cellKey) {
            return;
        }

        const fallback = this.#findFallbackCell(data ? this.#createSnapshot(data) : this.#lastFocusedCellSnapshot());
        if (fallback) {
            this.#setFocusedCell(fallback.key, fallback.value);
        } else {
            this.#lastFocusedCellKey.set(null);
        }
    }

    #createCellKey(data: NavigationData): string {
        if (data.groupHeader) {
            return `group:${data.groupKey ?? v4()}`;
        }
        if (data.section === "header") {
            return `header:${data.columnId ?? data.colIndex}`;
        }
        if (data.section === "add") {
            return `add:${data.columnId ?? data.colIndex}`;
        }
        if (data.rowUid != null || data.columnId != null) {
            return `body:${data.rowUid ?? data.rowIndex}:${data.columnId ?? data.colIndex}`;
        }
        return `${data.section}:${data.rowIndex}:${data.colIndex}`;
    }

    #createSnapshot(data: NavigationData): NavigationCellSnapshot {
        return {
            cellKind: data.cellKind,
            colIndex: data.colIndex,
            columnId: data.columnId,
            groupHeader: data.groupHeader,
            groupKey: data.groupKey,
            rowIndex: data.rowIndex,
            rowUid: data.rowUid,
            section: data.section
        };
    }

    #ensureFocusedCell(): void {
        if (this.#getFocusedCell()) {
            return;
        }
        const fallback = this.#findFallbackCell(this.#lastFocusedCellSnapshot());
        if (fallback) {
            this.#setFocusedCell(fallback.key, fallback.value);
        }
    }

    #findCellAt(
        section: GridNavigationSection,
        rowIndex: number,
        colIndex: number
    ): { key: string; value: NavigationData } | null {
        return (
            this.#cellElementDict().firstOrDefault(
                e => e.value.section === section && e.value.rowIndex === rowIndex && e.value.colIndex === colIndex
            ) ?? null
        );
    }

    #findCellsInRow(rowIndex: number, section: GridNavigationSection): { key: string; value: NavigationData }[] {
        return this.#cellElementDict()
            .where(e => e.value.section === section && e.value.rowIndex === rowIndex)
            .orderBy(e => e.value.colIndex)
            .toArray();
    }

    #findFallbackCell(snapshot: NavigationCellSnapshot | null): { key: string; value: NavigationData } | null {
        const dict = this.#cellElementDict();
        if (dict.isEmpty()) {
            return null;
        }

        if (snapshot) {
            const sameIdentity = dict.firstOrDefault(
                e =>
                    e.value.section === snapshot.section &&
                    e.value.columnId === snapshot.columnId &&
                    e.value.rowUid === snapshot.rowUid &&
                    e.value.groupKey === snapshot.groupKey
            );
            if (sameIdentity) {
                return sameIdentity;
            }

            const sameColumn = dict
                .where(e => e.value.section === snapshot.section && e.value.columnId === snapshot.columnId)
                .orderBy(e => Math.abs(e.value.rowIndex - snapshot.rowIndex))
                .thenBy(e => e.value.colIndex)
                .firstOrDefault();
            if (sameColumn) {
                return sameColumn;
            }

            const sameSection = dict
                .where(e => e.value.section === snapshot.section)
                .orderBy(e => Math.abs(e.value.rowIndex - snapshot.rowIndex))
                .thenBy(e => Math.abs(e.value.colIndex - snapshot.colIndex))
                .firstOrDefault();
            if (sameSection) {
                return sameSection;
            }
        }

        return this.#findFirstHeaderCell() ?? this.#findFirstCell();
    }

    #findFirstCell(): { key: string; value: NavigationData } | null {
        return this.#cellElementDict()
            .orderBy(d => this.#sectionOrder(d.value.section))
            .thenBy(d => d.value.rowIndex)
            .thenBy(d => d.value.colIndex)
            .firstOrDefault();
    }

    #findFirstHeaderCell(): { key: string; value: NavigationData } | null {
        return this.#cellElementDict()
            .where(d => d.value.section === "header")
            .orderBy(d => d.value.colIndex)
            .firstOrDefault();
    }

    #focusCell(key: string, data: NavigationData): void {
        this.#focusElement(data.element);
        this.#setFocusedCell(key, data);
    }

    #focusElement(element: HTMLElement): void {
        element.focus();
        element.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    #getFocusedCell(): { key: string; value: NavigationData } | null {
        const key = this.#lastFocusedCellKey();
        if (!key) {
            return null;
        }
        const data = this.#cellElementDict().get(key);
        return data ? { key, value: data } : null;
    }

    #navigateHorizontally(direction: "left" | "right", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data || data.groupHeader) {
            return false;
        }
        if (direction === "left") {
            if (data.firstInRow) {
                return false;
            }
            const prevCell = this.#findCellAt(data.section, data.rowIndex, data.colIndex - 1);
            if (prevCell) {
                this.#focusCell(prevCell.key, prevCell.value);
                return true;
            }
        } else {
            if (data.lastInRow) {
                return false;
            }
            const nextCell = this.#findCellAt(data.section, data.rowIndex, data.colIndex + 1);
            if (nextCell) {
                this.#focusCell(nextCell.key, nextCell.value);
                return true;
            }
        }
        return false;
    }

    #navigateToGridEdge(edge: "first" | "last"): boolean {
        const dict = this.#cellElementDict();
        if (dict.isEmpty()) {
            return false;
        }
        const sorted = dict
            .orderBy(d => this.#sectionOrder(d.value.section))
            .thenBy(d => d.value.rowIndex)
            .thenBy(d => d.value.colIndex);
        const target = edge === "first" ? sorted.firstOrDefault() : sorted.lastOrDefault();
        if (!target) {
            return false;
        }
        this.#focusCell(target.key, target.value);
        if (!target.value.groupHeader) {
            this.#lastNonGroupCellKey.set(target.key);
        }
        return true;
    }

    #navigateVertically(direction: "down" | "up", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data) {
            return false;
        }
        if (!data.groupHeader) {
            this.#lastNonGroupCellKey.set(cellKey);
        }
        const lastNonGroupCellKey = this.#lastNonGroupCellKey();
        const lastNonGroupCellData = lastNonGroupCellKey ? this.#cellElementDict().get(lastNonGroupCellKey) : null;
        const targetRowIndex = direction === "down" ? data.rowIndex + 1 : data.rowIndex - 1;
        const targetSection: GridNavigationSection = targetRowIndex < 0 ? "header" : "body";
        const targetRowCells = this.#findCellsInRow(targetRowIndex, targetSection);
        if (targetRowCells.length === 0) {
            return false;
        }

        const isTargetGroupHeader = targetRowCells[0].value.groupHeader;
        const targetColIndex = isTargetGroupHeader ? 0 : (lastNonGroupCellData?.colIndex ?? 0);
        const targetCell =
            this.#findCellAt(targetSection, targetRowIndex, targetColIndex) ??
            targetRowCells.find(e => e.value.colIndex >= targetColIndex) ??
            targetRowCells[targetRowCells.length - 1];
        if (targetCell) {
            this.#focusCell(targetCell.key, targetCell.value);
            return true;
        }
        return false;
    }

    #navigationDataEqual(left: NavigationData, right: NavigationData): boolean {
        return (
            left.cellKind === right.cellKind &&
            left.colIndex === right.colIndex &&
            left.columnId === right.columnId &&
            left.element === right.element &&
            left.firstInRow === right.firstInRow &&
            left.groupHeader === right.groupHeader &&
            left.groupKey === right.groupKey &&
            left.lastInRow === right.lastInRow &&
            left.rowIndex === right.rowIndex &&
            left.rowUid === right.rowUid &&
            left.section === right.section
        );
    }

    #navigateToRowEdge(edge: "first" | "last", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data || data.groupHeader) {
            return false;
        }
        const rowCells = this.#findCellsInRow(data.rowIndex, data.section);
        if (rowCells.length === 0) {
            return false;
        }
        const target = edge === "first" ? rowCells[0] : rowCells[rowCells.length - 1];
        if (target.key === cellKey) {
            return false;
        }
        this.#focusCell(target.key, target.value);
        if (!target.value.groupHeader) {
            this.#lastNonGroupCellKey.set(target.key);
        }
        return true;
    }

    #sectionOrder(section: GridNavigationSection): number {
        switch (section) {
            case "header":
                return 0;
            case "add":
                return 1;
            case "body":
                return 2;
        }
    }

    #setFocusedCell(key: string, data: NavigationData): void {
        this.#lastFocusedCellKey.set(key);
        this.#lastFocusedCellSnapshot.set(this.#createSnapshot(data));
    }
}

export type GridCellKind = "command" | "data" | "detail" | "group" | "header";

export type GridNavigationSection = "add" | "body" | "header";

export interface NavigationData {
    cellKind: GridCellKind;
    colIndex: number;
    columnId?: string;
    element: HTMLTableCellElement;
    firstInRow: boolean;
    groupHeader: boolean;
    groupKey?: string;
    lastInRow: boolean;
    rowIndex: number;
    rowUid?: string;
    section: GridNavigationSection;
}

interface NavigationCellSnapshot {
    cellKind: GridCellKind;
    colIndex: number;
    columnId?: string;
    groupHeader: boolean;
    groupKey?: string;
    rowIndex: number;
    rowUid?: string;
    section: GridNavigationSection;
}
