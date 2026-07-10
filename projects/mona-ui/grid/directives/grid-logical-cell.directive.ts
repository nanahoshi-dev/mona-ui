import { Clipboard } from "@angular/cdk/clipboard";
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
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { filter, fromEvent } from "rxjs";
import {
    GridCellKind,
    GridNavigationSection,
    GridNavigationService,
    NavigationData
} from "../services/grid-navigation.service";
import { GridService } from "../services/grid.service";
import { gridListTableCellThemeVariants } from "../styles/grid.styles";

const FOCUSABLE_TARGET_SELECTOR = "button, input, select, textarea, a[href], [tabindex]";

@Directive({
    selector: "td[monaGridLogicalCell], th[monaGridLogicalCell]",
    host: {
        "[class]": "baseClass()",
        "[attr.tabindex]": "focused() ? 0 : -1",
        "[attr.aria-colindex]": "ariaColIndex()"
    }
})
export class GridLogicalCellDirective {
    readonly #cellData = computed(() => {
        const data: NavigationData = {
            cellKind: this.resolvedCellKind(),
            colIndex: this.colIndex(),
            columnId: this.columnId(),
            element: this.#hostElementRef.nativeElement,
            firstInRow: this.firstInRow(),
            groupHeader: this.groupHeader(),
            groupKey: this.groupKey(),
            lastInRow: this.lastInRow(),
            rowIndex: this.rowIndex(),
            rowUid: this.rowUid(),
            section: this.resolvedSection()
        };
        return data;
    });
    readonly #cellKey = signal<string | null>(null);
    readonly #clipboard = inject(Clipboard);
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #gridService = inject(GridService);
    readonly #hostElementRef = inject(ElementRef<HTMLTableCellElement>);
    readonly #themeService = inject(ThemeService);
    protected readonly ariaColIndex = computed(() => this.colIndex() + this.#gridService.groupColumns().length + 1);
    protected readonly baseClass = computed(() => {
        if (this.#hostElementRef.nativeElement.tagName === "TH") {
            return "";
        }
        const theme = this.#themeService.theme();
        return gridListTableCellThemeVariants(theme)({
            groupHeader: this.groupHeader(),
            lastInRow: this.lastInRow() || this.groupHeader()
        });
    });
    protected readonly focused = computed(() => {
        const key = this.#cellKey();
        if (!key) {
            return false;
        }
        return this.#gridNavigationService.isFocused(key);
    });
    protected readonly resolvedCellKind = computed<GridCellKind>(() => {
        const cellKind = this.cellKind();
        if (cellKind != null) {
            return cellKind;
        }
        if (this.groupHeader()) {
            return "group";
        }
        if (this.#hostElementRef.nativeElement.tagName === "TH") {
            return "header";
        }
        return "data";
    });
    protected readonly resolvedSection = computed<GridNavigationSection>(() => {
        const section = this.section();
        if (section != null) {
            return section;
        }
        return this.#hostElementRef.nativeElement.tagName === "TH" ? "header" : "body";
    });
    public readonly cellKind = input<GridCellKind | null>(null);
    public readonly colIndex = input.required<number>();
    public readonly columnId = input<string>();
    public readonly edit = output();
    public readonly firstInRow = input.required<boolean>();
    public readonly groupHeader = input<boolean>(false);
    public readonly groupKey = input<string>();
    public readonly lastInRow = input.required<boolean>();
    public readonly rowIndex = input.required<number>();
    public readonly rowUid = input<string>();
    public readonly section = input<GridNavigationSection | null>(null);
    public readonly toggle = output();

    public constructor() {
        afterRenderEffect({
            read: () => {
                const previousCellKey = this.#cellKey();
                const nextCellKey = this.#gridNavigationService.registerCell(this.#cellData());
                if (previousCellKey && previousCellKey !== nextCellKey) {
                    this.#gridNavigationService.unregisterCell(previousCellKey);
                }
                this.#cellKey.set(nextCellKey);
                this.#syncInnerFocusableTabIndexes();
            }
        });
        afterNextRender({
            read: () => {
                this.#setCellCopySubscription();
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

    #focusInnerTarget(target: HTMLElement): void {
        target.focus();
    }

    #focusNextInnerTarget(currentTarget: HTMLElement, backwards: boolean): void {
        const targets = this.#getInnerFocusableTargets();
        if (targets.length === 0) {
            return;
        }
        const currentIndex = targets.findIndex(target => target === currentTarget || target.contains(currentTarget));
        const nextIndex =
            currentIndex === -1 ? 0 : (currentIndex + (backwards ? -1 : 1) + targets.length) % targets.length;
        this.#focusInnerTarget(targets[nextIndex]);
    }

    #focusFirstInnerTarget(): boolean {
        const target = this.#getInnerFocusableTargets()[0];
        if (!target) {
            return false;
        }
        this.#focusInnerTarget(target);
        return true;
    }

    #focusNextPageTabTarget(backwards: boolean): boolean {
        const host = this.#hostElementRef.nativeElement;
        const targets = this.#getPageTabTargets();
        const orderedTargets = backwards ? targets.reverse() : targets;
        const documentPosition = backwards ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING;
        const target = orderedTargets.find(
            candidate => (host.compareDocumentPosition(candidate) & documentPosition) !== 0
        );
        if (!target) {
            return false;
        }
        target.focus();
        return true;
    }

    #getInnerFocusableTargets(): HTMLElement[] {
        const host = this.#hostElementRef.nativeElement;
        const targets = Array.from(host.querySelectorAll(FOCUSABLE_TARGET_SELECTOR)) as HTMLElement[];
        return targets.filter(
            target => target !== host && !this.#isElementDisabled(target) && !this.#isElementHidden(target)
        );
    }

    #getPageTabTargets(): HTMLElement[] {
        const host = this.#hostElementRef.nativeElement;
        const targets = Array.from(host.ownerDocument.querySelectorAll(FOCUSABLE_TARGET_SELECTOR)) as HTMLElement[];
        return targets.filter(
            target =>
                target !== host &&
                target.getAttribute("tabindex") !== "-1" &&
                !this.#isElementDisabled(target) &&
                !this.#isElementHidden(target)
        );
    }

    #handleCommandInnerKeydown(event: KeyboardEvent, target: HTMLElement): void {
        if (event.key === "Escape") {
            event.preventDefault();
            this.#hostElementRef.nativeElement.focus();
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();
            this.#focusNextInnerTarget(target, event.shiftKey);
            return;
        }

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            this.#focusNextInnerTarget(target, false);
            return;
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            this.#focusNextInnerTarget(target, true);
        }
    }

    #isElementDisabled(element: HTMLElement): boolean {
        if (
            (element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement) &&
            element.disabled
        ) {
            return true;
        }

        return element.getAttribute("aria-disabled") === "true" || element.hasAttribute("disabled");
    }

    #isElementHidden(element: HTMLElement): boolean {
        return element.closest("[hidden]") != null || element.getAttribute("aria-hidden") === "true";
    }

    #navigate(navigationKey: string): boolean {
        const cellKey = this.#cellKey();
        if (!cellKey) {
            return false;
        }
        return this.#gridNavigationService.navigate(cellKey, navigationKey);
    }

    #onEnterKey(): void {
        if (this.groupHeader() || this.resolvedSection() === "header") {
            this.toggle.emit();
            return;
        }
        if (this.resolvedCellKind() === "command") {
            this.#focusFirstInnerTarget();
            return;
        }
        if (this.#gridService.editableOptions().mode === "row") {
            return;
        }
        this.edit.emit();
    }

    #onF2Key(): void {
        if (this.resolvedCellKind() === "command") {
            this.#focusFirstInnerTarget();
            return;
        }
        if (this.#gridService.editableOptions().mode === "row") {
            return;
        }
        this.edit.emit();
    }

    #onHostKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        const host = this.#hostElementRef.nativeElement;
        if (target && target !== host) {
            if (this.resolvedCellKind() === "command") {
                this.#handleCommandInnerKeydown(event, target);
            }
            return;
        }

        if (event.key === "Tab") {
            if (this.#focusNextPageTabTarget(event.shiftKey)) {
                event.preventDefault();
            }
            return;
        }

        if (
            !event.key.startsWith("Arrow") &&
            event.key !== "Enter" &&
            event.key !== "F2" &&
            event.key !== "Home" &&
            event.key !== "End"
        ) {
            return;
        }

        if (event.key === "ArrowDown") {
            if (event.altKey) {
                this.toggle.emit();
                event.preventDefault();
                return;
            }
            event.preventDefault();
            this.#navigate("ArrowDown");
        } else if (event.key === "ArrowLeft") {
            if (this.#navigate("ArrowLeft")) {
                event.preventDefault();
            }
        } else if (event.key === "ArrowRight") {
            if (this.#navigate("ArrowRight")) {
                event.preventDefault();
            }
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            this.#navigate("ArrowUp");
        } else if (event.key === "Enter") {
            event.preventDefault();
            this.#onEnterKey();
        } else if (event.key === "F2") {
            event.preventDefault();
            this.#onF2Key();
        } else if (event.key === "Home") {
            event.preventDefault();
            this.#navigate(event.ctrlKey ? "CtrlHome" : "Home");
        } else if (event.key === "End") {
            event.preventDefault();
            this.#navigate(event.ctrlKey ? "CtrlEnd" : "End");
        }
    }

    #setCellCopySubscription(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                filter(e => (e.ctrlKey || e.metaKey) && e.key === "c"),
                filter(() => this.rowIndex() >= 0 && !this.#gridService.isInEditMode())
            )
            .subscribe(() => {
                const text = this.#hostElementRef.nativeElement.innerText?.trim() ?? "";
                if (text) {
                    this.#clipboard.copy(text);
                }
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
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(e => this.#onHostKeydown(e));
    }

    #syncInnerFocusableTabIndexes(): void {
        for (const target of this.#getInnerFocusableTargets()) {
            target.setAttribute("tabindex", "-1");
        }
    }
}
