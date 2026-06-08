import {
    afterNextRender,
    afterRenderEffect,
    computed,
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    input,
    output,
    signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, fromEvent } from "rxjs";
import { ThemeService } from "../../theme/services/theme.service";
import { GridNavigationService, NavigationData } from "../services/grid-navigation.service";
import { gridListTableCellThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridLogicalCell], th[monaGridLogicalCell]",
    host: {
        "[class]": "baseClass()",
        "[attr.tabindex]": "focused() ? 0 : -1"
    }
})
export class GridLogicalCellDirective {
    readonly #cellData = computed(() => {
        const data: NavigationData = {
            colIndex: this.colIndex(),
            element: this.#hostElementRef.nativeElement,
            firstInRow: this.firstInRow(),
            groupHeader: this.groupHeader(),
            groupKey: this.groupKey(),
            lastInRow: this.lastInRow(),
            rowIndex: this.rowIndex()
        };
        return data;
    });
    readonly #cellKey = signal<string | null>(null);
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        if (this.#hostElementRef.nativeElement.tagName === "TH") {
            return "";
        }
        const theme = this.#themeService.theme();
        return gridListTableCellThemeVariants(theme)();
    });
    protected readonly focused = computed(() => {
        const key = this.#cellKey();
        if (!key) {
            return false;
        }
        return this.#gridNavigationService.isFocused(key);
    });
    public readonly colIndex = input.required<number>();
    public readonly edit = output();
    public readonly firstInRow = input.required<boolean>();
    public readonly groupHeader = input<boolean>(false);
    public readonly groupKey = input<string>();
    public readonly lastInRow = input.required<boolean>();
    public readonly rowIndex = input.required<number>();
    public readonly toggle = output();

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.#cellKey.set(this.#gridNavigationService.registerCell(this.#cellData()));
            }
        });
        afterNextRender({
            read: () => {
                this.#setKeyboardNavigation();
            }
        });
        this.#destroyRef.onDestroy(() => {
            const cellKey = this.#cellKey();
            if (!cellKey) {
                return;
            }
            this.#gridNavigationService.unregisterCell(cellKey);
        });
    }

    #setKeyboardNavigation(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                const key = this.#cellKey();
                if (key) {
                    this.#gridNavigationService.setLastFocusedCellKey(key);
                }
            });
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(
                    e =>
                        e.key.startsWith("Arrow") ||
                        e.key === "Enter" ||
                        e.key === "F2" ||
                        e.key === "Home" ||
                        e.key === "End"
                ),
                filter(e => {
                    const tag = (e.target as HTMLElement).tagName.toLowerCase();
                    return tag !== "input" && tag !== "textarea";
                })
            )
            .subscribe(e => {
                if (e.key === "ArrowDown") {
                    if (e.altKey) {
                        this.toggle.emit();
                        e.preventDefault();
                        return;
                    }
                    e.preventDefault();
                    this.#navigate("ArrowDown");
                } else if (e.key === "ArrowLeft") {
                    if (this.#navigate("ArrowLeft")) {
                        e.preventDefault();
                    }
                } else if (e.key === "ArrowRight") {
                    if (this.#navigate("ArrowRight")) {
                        e.preventDefault();
                    }
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    this.#navigate("ArrowUp");
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (this.groupHeader()) {
                        this.toggle.emit();
                    } else {
                        this.edit.emit();
                    }
                } else if (e.key === "F2") {
                    e.preventDefault();
                    this.edit.emit();
                } else if (e.key === "Home") {
                    e.preventDefault();
                    if (e.ctrlKey) {
                        this.#navigate("CtrlHome");
                    } else {
                        this.#navigate("Home");
                    }
                } else if (e.key === "End") {
                    e.preventDefault();
                    if (e.ctrlKey) {
                        this.#navigate("CtrlEnd");
                    } else {
                        this.#navigate("End");
                    }
                }
            });
    }

    #navigate(navigationKey: string): boolean {
        const cellKey = this.#cellKey();
        if (!cellKey) {
            return false;
        }
        return this.#gridNavigationService.navigate(cellKey, navigationKey);
    }
}
