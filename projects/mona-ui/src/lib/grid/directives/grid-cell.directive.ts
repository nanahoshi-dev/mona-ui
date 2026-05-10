import { afterRenderEffect, computed, DestroyRef, Directive, ElementRef, inject, input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, fromEvent, tap } from "rxjs";
import { ThemeService } from "../../theme/services/theme.service";
import { GridNavigationService } from "../services/grid-navigation.service";
import { gridListTableCellThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridCell]",
    host: {
        "[class]": "baseClass()",
        "[attr.data-column-index]": "columnIndex()",
        "[attr.data-row-index]": "rowIndex()",
        "[attr.tabindex]": "focused() ? 0 : -1"
    }
})
export class GridCellDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListTableCellThemeVariants(theme)();
    });
    protected readonly focused = computed(() => {
        const indices = this.#resolveIndices();
        if (!indices) {
            return false;
        }
        return this.#gridNavigationService.isFocused(indices);
    });
    public readonly columnIndex = input<number>();
    public readonly rowIndex = input<number>();

    public constructor() {
        afterRenderEffect(() => {
            const element = this.#hostElementRef.nativeElement;
            const indices = this.#resolveIndices();
            if (indices) {
                this.#gridNavigationService.registerCell(indices.rowIndex, indices.colIndex, element);
            }
            this.#setSubscriptions();
        });
    }

    #handleDownArrowKey(): void {
        const indices = this.#resolveIndices();
        if (!indices) {
            return;
        }
        const nextRowIndex = indices.rowIndex + 1;
        this.#gridNavigationService.navigate(nextRowIndex, indices.colIndex);
    }

    #handleEndKey(ctrlKey: boolean): void {
        const indices = this.#resolveIndices();
        if (!indices) {
            return;
        }

        if (ctrlKey) {
            this.#gridNavigationService.navigateToLastCellInGrid();
        } else {
            this.#gridNavigationService.navigateToLastCellInRow(indices.rowIndex);
        }
    }

    #handleLeftArrowKey(): void {
        const indices = this.#resolveIndices();
        if (!indices) {
            return;
        }
        const nextColIndex = indices.colIndex - 1;
        this.#gridNavigationService.navigate(indices.rowIndex, nextColIndex);
    }

    #handleRightArrowKey(): void {
        const indices = this.#resolveIndices();
        if (!indices) {
            return;
        }
        const nextColIndex = indices.colIndex + 1;
        this.#gridNavigationService.navigate(indices.rowIndex, nextColIndex);
    }

    #handleHomeKey(ctrlKey: boolean): void {
        const indices = this.#resolveIndices();
        if (!indices) {
            return;
        }
        if (ctrlKey) {
            this.#gridNavigationService.navigateToFirstCellInGrid();
        } else {
            this.#gridNavigationService.navigate(indices.rowIndex, 0);
        }
    }

    #handleUpArrowKey(): void {
        const indices = this.#resolveIndices();
        if (!indices) {
            return;
        }
        const nextRowIndex = indices.rowIndex - 1;
        this.#gridNavigationService.navigate(nextRowIndex, indices.colIndex);
    }

    #resolveIndices(): { rowIndex: number; colIndex: number } | null {
        const rowIndex = this.rowIndex();
        const colIndex = this.columnIndex();
        if (rowIndex == null || colIndex == null) {
            return null;
        }
        return { rowIndex, colIndex };
    }

    #setKeyboardSubscriptions(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                filter(
                    event =>
                        event.key === "ArrowDown" ||
                        event.key === "ArrowRight" ||
                        event.key === "ArrowUp" ||
                        event.key === "ArrowLeft" ||
                        event.key === "End" ||
                        event.key === "Home"
                ),
                tap(event => {
                    if (event.key === "ArrowDown") {
                        this.#handleDownArrowKey();
                    } else if (event.key === "ArrowRight") {
                        this.#handleRightArrowKey();
                    } else if (event.key === "ArrowUp") {
                        this.#handleUpArrowKey();
                    } else if (event.key === "ArrowLeft") {
                        this.#handleLeftArrowKey();
                    } else if (event.key === "End") {
                        event.preventDefault();
                        this.#handleEndKey(event.ctrlKey);
                    } else if (event.key === "Home") {
                        event.preventDefault();
                        this.#handleHomeKey(event.ctrlKey);
                    }
                }),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe();
    }

    #setSubscriptions(): void {
        this.#setKeyboardSubscriptions();
    }
}
