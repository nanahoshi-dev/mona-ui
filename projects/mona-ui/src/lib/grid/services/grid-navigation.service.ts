import { Injectable, signal } from "@angular/core";
import { ImmutableDictionary } from "@mirei/ts-collections";
import { v4 } from "uuid";

@Injectable()
export class GridNavigationService {
    readonly #cellElementDict = signal(ImmutableDictionary.create<string, NavigationData>());
    readonly #lastFocusedCellKey = signal<string | null>(null);
    readonly #lastNonGroupCellKey = signal<string | null>(null);

    public focusFirstCell(): void {
        const dict = this.#cellElementDict();
        const firstCell = dict
            .orderBy(d => d.value.rowIndex)
            .thenBy(d => d.value.colIndex)
            .firstOrDefault();
        if (firstCell) {
            this.#focusElement(firstCell.value.element);
            this.#lastFocusedCellKey.set(firstCell.key);
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
        this.#cellElementDict.update(dict => dict.put(cellKey, data));
        return cellKey;
    }

    public setLastFocusedCellKey(key: string): void {
        this.#lastFocusedCellKey.set(key);
    }

    public unregisterCell(cellKey: string): void {
        this.#cellElementDict.update(dict => dict.remove(cellKey));
    }

    #createCellKey(data: NavigationData): string {
        if (data.rowIndex != null && data.colIndex != null) {
            return `${data.rowIndex}:${data.colIndex}`;
        }
        if (data.groupHeader) {
            return data.groupKey ?? v4();
        }
        return v4();
    }

    #focusElement(element: HTMLElement): void {
        element.focus();
    }

    #findCellsInRow(rowIndex: number): { key: string; value: NavigationData }[] {
        return this.#cellElementDict()
            .where(e => e.value.rowIndex === rowIndex)
            .orderBy(e => e.value.colIndex)
            .toArray();
    }

    #navigateHorizontally(direction: "left" | "right", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data) {
            return false;
        }
        if (data.groupHeader) {
            return false;
        }
        if (direction === "left") {
            if (data.firstInRow) {
                return false;
            }
            const prevKey = `${data.rowIndex}:${data.colIndex - 1}`;
            const prevData = this.#cellElementDict().get(prevKey);
            if (prevData) {
                this.#focusElement(prevData.element);
                this.#lastFocusedCellKey.set(prevKey);
                return true;
            }
        } else if (direction === "right") {
            if (data.lastInRow) {
                return false;
            }
            const nextKey = `${data.rowIndex}:${data.colIndex + 1}`;
            const nextData = this.#cellElementDict().get(nextKey);
            if (nextData) {
                this.#focusElement(nextData.element);
                this.#lastFocusedCellKey.set(nextKey);
                return true;
            }
        }
        return false;
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
        const targetRowCells = this.#findCellsInRow(targetRowIndex);
        if (targetRowCells.length === 0) {
            return false;
        }
        const isTargetGroupHeader = targetRowCells[0].value.groupHeader;
        let targetColIndex: number;
        if (isTargetGroupHeader) {
            targetColIndex = 0;
        } else {
            targetColIndex = lastNonGroupCellData?.colIndex ?? 0;
        }
        const targetKey = `${targetRowIndex}:${targetColIndex}`;
        const targetData = this.#cellElementDict().get(targetKey);
        if (targetData) {
            this.#focusElement(targetData.element);
            this.#lastFocusedCellKey.set(targetKey);
            return true;
        }
        return false;
    }

    #navigateToRowEdge(edge: "first" | "last", cellKey: string): boolean {
        const data = this.#cellElementDict().get(cellKey);
        if (!data || data.groupHeader) {
            return false;
        }
        const rowCells = this.#findCellsInRow(data.rowIndex);
        if (rowCells.length === 0) {
            return false;
        }
        const target = edge === "first" ? rowCells[0] : rowCells[rowCells.length - 1];
        if (target.key === cellKey) {
            return false;
        }
        this.#focusElement(target.value.element);
        this.#lastFocusedCellKey.set(target.key);
        if (!target.value.groupHeader) {
            this.#lastNonGroupCellKey.set(target.key);
        }
        return true;
    }

    #navigateToGridEdge(edge: "first" | "last"): boolean {
        const dict = this.#cellElementDict();
        if (dict.isEmpty()) {
            return false;
        }
        const sorted = dict.orderBy(d => d.value.rowIndex).thenBy(d => d.value.colIndex);
        const target = edge === "first" ? sorted.firstOrDefault() : sorted.lastOrDefault();
        if (!target) {
            return false;
        }
        this.#focusElement(target.value.element);
        this.#lastFocusedCellKey.set(target.key);
        if (!target.value.groupHeader) {
            this.#lastNonGroupCellKey.set(target.key);
        }
        return true;
    }
}

export interface NavigationData {
    colIndex: number;
    element: HTMLTableCellElement;
    firstInRow: boolean;
    groupHeader: boolean;
    groupKey?: string;
    lastInRow: boolean;
    rowIndex: number;
}
