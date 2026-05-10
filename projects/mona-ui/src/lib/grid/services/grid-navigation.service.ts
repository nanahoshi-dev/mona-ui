import { Injectable, signal } from "@angular/core";
import { ImmutableDictionary } from "@mirei/ts-collections";

@Injectable()
export class GridNavigationService {
    readonly #cellElementDict = signal(ImmutableDictionary.create<string, HTMLTableCellElement>());
    public readonly focusedElement = signal<HTMLTableCellElement | null>(null);

    public getCellElement(rowIndex: number, colIndex: number): HTMLTableCellElement | null {
        const key = `${rowIndex}-${colIndex}`;
        return this.#cellElementDict().get(key);
    }

    public hasFocusedElement(): boolean {
        return this.focusedElement() !== null;
    }

    public isFocused(indices: { rowIndex: number; colIndex: number }): boolean {
        const { rowIndex, colIndex } = indices;
        if (!this.hasFocusedElement()) {
            return rowIndex === 0 && colIndex === 0;
        }

        const key = `${rowIndex}-${colIndex}`;
        const element = this.#cellElementDict().get(key);
        return element === this.focusedElement();
    }

    public navigate(rowIndex: number, colIndex: number): void {
        const key = `${rowIndex}-${colIndex}`;
        const element = this.#cellElementDict().get(key);
        if (element) {
            this.focusedElement.set(element);
            element.focus();
        }
    }

    public navigateToFirstCellInGrid(): void {
        const firstKey = this.#cellElementDict().keys().first();
        if (firstKey) {
            const [rowIndex, colIndex] = firstKey.split("-").map(Number);
            this.navigate(rowIndex, colIndex);
        }
    }

    public navigateToLastCellInGrid(): void {
        const lastKey = this.#cellElementDict().keys().last();
        if (lastKey) {
            const [rowIndex, colIndex] = lastKey.split("-").map(Number);
            this.navigate(rowIndex, colIndex);
        }
    }

    public navigateToLastCellInRow(rowIndex: number): void {
        const lastColIndex =
            this.#cellElementDict()
                .keys()
                .where(key => key.startsWith(`${rowIndex}-`))
                .count() - 1;
        this.navigate(rowIndex, lastColIndex);
    }

    public registerCell(rowIndex: number, colIndex: number, element: HTMLTableCellElement): void {
        const key = `${rowIndex}-${colIndex}`;
        this.#cellElementDict.update(dict => dict.put(key, element));
    }
}
