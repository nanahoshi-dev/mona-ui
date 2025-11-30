import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    input,
    signal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { compact } from "@mirei/ts-collections";
import { LucideAngularModule } from "lucide-angular";
import { filter, fromEvent, map, merge, skipUntil, takeUntil, tap } from "rxjs";
import { ThemeService } from "../../../../theme/services/theme.service";
import { splitterResizerThemeVariants, SplitterVariantProps } from "../../styles/splitter.styles";
import { SplitterPaneComponent } from "../splitter-pane/splitter-pane.component";
import { SplitterResizerHandleComponent } from "../splitter-resizer-handle/splitter-resizer-handle.component";
import { SplitterComponent } from "../splitter/splitter.component";

interface PaneElementData {
    pane: SplitterPaneComponent;
    element: HTMLElement;
    size: number;
}

@Component({
    selector: "mona-splitter-resizer",
    templateUrl: "./splitter-resizer.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideAngularModule, SplitterResizerHandleComponent],
    host: {
        "[class]": "baseClass()",
        "[style.cursor]": "resizable() ? (orientation()==='horizontal' ? 'ew-resize' : 'ns-resize') : 'auto'",
        "(dblclick)": "toggleCollapse()",
        tabindex: "0"
    }
})
export class SplitterResizerComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef);
    readonly #paneSizeMemory = new WeakMap<SplitterPaneComponent, number>();
    readonly #splitter = inject(SplitterComponent);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const orientation = this.orientation();
        const resizing = this.resizing();
        return splitterResizerThemeVariants(theme)({ orientation, resizing });
    });
    protected readonly hovered = signal(false);
    protected readonly nextCollapseControlsVisible = computed(() => {
        return this.hovered() && this.nextPane().collapsible() && !this.nextPane().collapsed();
    });
    protected readonly previousCollapseControlsVisible = computed(() => {
        return this.hovered() && this.previousPane().collapsible() && !this.previousPane().collapsed();
    });
    protected readonly resizable = computed(() => {
        return this.previousPane().resizable() && this.nextPane().resizable();
    });
    protected readonly resizing = signal(false);
    public readonly nextPane = input.required<SplitterPaneComponent>();
    public readonly orientation = input.required<SplitterVariantProps["orientation"]>();
    public readonly previousPane = input.required<SplitterPaneComponent>();

    public constructor() {
        afterNextRender({
            read: () => {
                this.setPointerEvents();
                this.setKeyboardEvents();
            }
        });
    }

    protected collapseNext(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.collapsePane("next");
    }

    protected collapsePrevious(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.collapsePane("previous");
    }

    protected toggleCollapse(): void {
        const targetPane = this.getCollapsibleTargetPane();
        if (targetPane === null) {
            return;
        }
        const targetElement =
            targetPane.uid === this.previousPane().uid ? this.getPaneElements()[0] : this.getPaneElements()[1];
        const direction = targetPane.uid === this.previousPane().uid ? "previous" : "next";
        this.togglePane(targetPane, targetElement, direction);
    }

    private clamp(value: number, min: number, max: number): number {
        if (Number.isFinite(max)) {
            return Math.min(Math.max(value, min), max);
        }
        return Math.max(value, min);
    }

    private clampPaneSizes(
        total: number,
        desiredPrev: number,
        previousPane: SplitterPaneComponent,
        nextPane: SplitterPaneComponent
    ): [number, number] {
        const prevMin = this.getMinSize(previousPane);
        const nextMin = this.getMinSize(nextPane);
        const prevMaxRaw = this.getMaxSize(previousPane);
        const nextMaxRaw = this.getMaxSize(nextPane);

        const prevMax = Math.min(prevMaxRaw, total - nextMin);
        const prevMinBound = Math.max(prevMin, total - nextMaxRaw);

        let prevSize = this.clamp(desiredPrev, prevMinBound, prevMax);
        let nextSize = total - prevSize;

        if (nextSize < nextMin) {
            nextSize = nextMin;
            prevSize = total - nextSize;
        } else if (nextSize > nextMaxRaw) {
            nextSize = nextMaxRaw;
            prevSize = total - nextSize;
        }

        // final guard for prev bounds
        prevSize = this.clamp(prevSize, prevMin, prevMaxRaw);
        nextSize = total - prevSize;
        return [prevSize, nextSize];
    }

    private collapseAndRedistribute(
        targetPane: SplitterPaneComponent,
        targetSize: number,
        leading: PaneElementData | null,
        trailing: PaneElementData | null
    ): void {
        if (targetSize <= 0) {
            return;
        }

        const leadingNeighbor =
            leading !== null && !(leading.pane.collapsible() && leading.pane.collapsed()) ? leading : null;
        const trailingNeighbor =
            trailing !== null && !(trailing.pane.collapsible() && trailing.pane.collapsed()) ? trailing : null;
        const neighbors = compact([leadingNeighbor, trailingNeighbor]).toArray();

        if (neighbors.length === 0) {
            targetPane.collapsed.set(true);
            return;
        }

        this.distributeSpaceToNeighbors(targetSize, neighbors);
        targetPane.collapsed.set(true);
    }

    private collapsePane(direction: "previous" | "next"): void {
        const target = this.pickTargetPane(direction);
        if (target === null || !target.pane.collapsible()) {
            return;
        }
        this.togglePane(target.pane, target.element, target.direction);
    }

    private distributeSpaceToNeighbors(space: number, neighbors: PaneElementData[]): void {
        let remaining = space;
        const capacities = neighbors.map(neighbor => {
            const max = this.getMaxSize(neighbor.pane);
            const capacity =
                max === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(0, max - neighbor.size);
            return { neighbor, capacity };
        });

        const infiniteRecipients = capacities.filter(c => !Number.isFinite(c.capacity));
        if (infiniteRecipients.length > 0) {
            const share = remaining / infiniteRecipients.length;
            infiniteRecipients.forEach(c => {
                c.neighbor.pane.size.set(`${c.neighbor.size + share}px`);
            });
            return;
        }

        let available = capacities.reduce((sum, c) => sum + c.capacity, 0);
        if (available <= 0) {
            return;
        }

        capacities.forEach(c => {
            const share = (c.capacity / available) * remaining;
            c.neighbor.pane.size.set(`${c.neighbor.size + share}px`);
        });
    }

    private ensureExpandedBeforeResize(): void {
        if (this.previousPane().collapsed()) {
            this.previousPane().collapsed.set(false);
        }
        if (this.nextPane().collapsed()) {
            this.nextPane().collapsed.set(false);
        }
    }

    private expandPane(
        targetPane: SplitterPaneComponent,
        desiredSize: number,
        leading: PaneElementData | null,
        trailing: PaneElementData | null
    ): void {
        const targetMin = this.getMinSize(targetPane);
        const targetMax = this.getMaxSize(targetPane);

        if (desiredSize <= 0) {
            targetPane.collapsed.set(false);
            return;
        }

        const currentLeadingSize = leading?.size ?? 0;
        const currentTrailingSize = trailing?.size ?? 0;
        const neighborTotal = currentLeadingSize + currentTrailingSize;

        if (neighborTotal <= 0) {
            const clampedTarget = this.clamp(desiredSize, targetMin, targetMax);
            targetPane.size.set(`${clampedTarget}px`);
            targetPane.collapsed.set(false);
            return;
        }

        const availableFromLeading =
            leading !== null ? Math.max(0, currentLeadingSize - this.getMinSize(leading.pane)) : 0;
        const availableFromTrailing =
            trailing !== null ? Math.max(0, currentTrailingSize - this.getMinSize(trailing.pane)) : 0;
        const availableTotal = availableFromLeading + availableFromTrailing;
        if (availableTotal <= 0) {
            targetPane.collapsed.set(false);
            return;
        }

        const desiredClamped = this.clamp(desiredSize, targetMin, targetMax);
        const targetSize = Math.min(desiredClamped, availableTotal);

        if (leading !== null && availableFromLeading > 0) {
            const takeFromLeading = targetSize * (availableFromLeading / availableTotal);
            const newSize = Math.max(this.getMinSize(leading.pane), currentLeadingSize - takeFromLeading);
            leading.pane.size.set(`${newSize}px`);
        }
        if (trailing !== null && availableFromTrailing > 0) {
            const takeFromTrailing = targetSize * (availableFromTrailing / availableTotal);
            const newSize = Math.max(this.getMinSize(trailing.pane), currentTrailingSize - takeFromTrailing);
            trailing.pane.size.set(`${newSize}px`);
        }

        targetPane.size.set(`${targetSize}px`);
        targetPane.collapsed.set(false);
    }

    private findPaneToLeft(element: HTMLElement): { pane: SplitterPaneComponent; element: HTMLElement } | null {
        let cursor: HTMLElement | null = element.previousElementSibling as HTMLElement | null;
        while (cursor !== null) {
            if (cursor.dataset["pid"]) {
                const pane = this.#splitter.getPaneByUid(cursor.dataset["pid"]!);
                if (pane != null) {
                    return { pane, element: cursor };
                }
            }
            cursor = cursor.previousElementSibling as HTMLElement | null;
        }
        return null;
    }

    private findPaneToRight(element: HTMLElement): Omit<PaneElementData, "size"> | null {
        let cursor: HTMLElement | null = element.nextElementSibling as HTMLElement | null;
        while (cursor !== null) {
            if (cursor.dataset["pid"]) {
                const pane = this.#splitter.getPaneByUid(cursor.dataset["pid"]!);
                if (pane != null) {
                    return { pane, element: cursor };
                }
            }
            cursor = cursor.nextElementSibling as HTMLElement | null;
        }
        return null;
    }

    private focusAdjacentResizer(forward: boolean): boolean {
        let cursor: Element | null = this.#hostElementRef.nativeElement;
        if (!cursor) {
            return false;
        }
        while (true) {
            cursor = forward ? cursor.nextElementSibling : cursor.previousElementSibling;
            if (cursor === null) {
                return false;
            }
            if (cursor instanceof HTMLElement && cursor.tagName.toLowerCase() === "mona-splitter-resizer") {
                cursor.focus();
                return true;
            }
        }
    }

    private getCollapsibleTargetPane(): SplitterPaneComponent | null {
        const previousPane = this.previousPane();
        const nextPane = this.nextPane();

        if (previousPane.collapsible() && previousPane.collapsed()) {
            return previousPane;
        }
        if (nextPane.collapsible() && nextPane.collapsed()) {
            return nextPane;
        }
        if (previousPane.collapsible()) {
            return previousPane;
        }
        if (nextPane.collapsible()) {
            return nextPane;
        }
        return null;
    }

    private getMaxSize(pane: SplitterPaneComponent): number {
        const max = pane.max();
        const parsed = this.parseSizeInput(max);
        return parsed === null ? Number.POSITIVE_INFINITY : Math.max(0, parsed);
    }

    private getMinSize(pane: SplitterPaneComponent): number {
        const min = pane.min();
        const parsed = this.parseSizeInput(min);
        return parsed === null ? 0 : Math.max(0, parsed);
    }

    private getNeighborPanes(
        targetElement: HTMLElement,
        direction: "previous" | "next"
    ): { leading: PaneElementData | null; trailing: PaneElementData | null } {
        const [previousElement, nextElement] = this.getPaneElements();
        const leadingPane =
            direction === "previous"
                ? this.findPaneToLeft(targetElement)
                : { pane: this.previousPane(), element: previousElement };
        const trailingPane =
            direction === "previous"
                ? { pane: this.nextPane(), element: nextElement }
                : this.findPaneToRight(targetElement);

        return {
            leading: leadingPane !== null ? { ...leadingPane, size: this.measurePaneSize(leadingPane.element) } : null,
            trailing:
                trailingPane !== null ? { ...trailingPane, size: this.measurePaneSize(trailingPane.element) } : null
        };
    }

    private getPaneElements(): [HTMLElement, HTMLElement] {
        const previousPane = this.#hostElementRef.nativeElement.previousElementSibling;
        const nextPane = this.#hostElementRef.nativeElement.nextElementSibling;
        if (previousPane === null || nextPane === null) {
            throw new Error("The previous or next pane element is not found.");
        }
        return [previousPane as HTMLDivElement, nextPane as HTMLDivElement];
    }

    private getPaneRectangles(): [DOMRect, DOMRect] {
        const [previousPane, nextPane] = this.getPaneElements();
        return [previousPane.getBoundingClientRect(), nextPane.getBoundingClientRect()];
    }

    private handleCollapserKeys(key: string): boolean {
        const orientation = this.orientation();

        if (orientation === "horizontal") {
            if (key === "ArrowLeft") {
                this.collapsePane("previous");
                return true;
            }
            if (key === "ArrowRight") {
                this.collapsePane("next");
                return true;
            }
        } else {
            if (key === "ArrowUp") {
                this.collapsePane("previous");
                return true;
            }
            if (key === "ArrowDown") {
                this.collapsePane("next");
                return true;
            }
        }
        return false;
    }

    private handleKeydown(event: KeyboardEvent): boolean {
        const key = event.key;

        if (key === "Tab") {
            return this.focusAdjacentResizer(!event.shiftKey);
        }

        if (key === "Enter") {
            this.toggleCollapse();
            return true;
        }

        if (event.ctrlKey && event.metaKey) {
            return this.handleCollapserKeys(key);
        }
        return this.handleResizerKeys(key);
    }

    private handleResizerKeys(key: string): boolean {
        const orientation = this.orientation();
        const step = 10;
        const previousPane = this.previousPane();
        const nextPane = this.nextPane();
        if (!previousPane.resizable() && !nextPane.resizable()) {
            return false;
        }
        if (orientation === "horizontal") {
            if (key === "ArrowLeft") {
                this.nudgeSplitter(-step);
                return true;
            }
            if (key === "ArrowRight") {
                this.nudgeSplitter(step);
                return true;
            }
        } else {
            if (key === "ArrowUp") {
                this.nudgeSplitter(-step);
                return true;
            }
            if (key === "ArrowDown") {
                this.nudgeSplitter(step);
                return true;
            }
        }
        return false;
    }

    private measurePaneSize(paneElement: HTMLElement): number {
        const rect = paneElement.getBoundingClientRect();
        const orientation = this.orientation();
        return orientation === "horizontal" ? rect.width : rect.height;
    }

    private nudgeSplitter(delta: number): void {
        this.ensureExpandedBeforeResize();
        const [previousRect, nextRect] = this.getPaneRectangles();
        const total =
            this.orientation() === "horizontal"
                ? previousRect.width + nextRect.width
                : previousRect.height + nextRect.height;
        const currentPrev = this.orientation() === "horizontal" ? previousRect.width : previousRect.height;
        const desiredPrev = this.clamp(currentPrev + delta, 0, total);
        const [prevSize, nextSize] = this.clampPaneSizes(total, desiredPrev, this.previousPane(), this.nextPane());
        this.updatePaneSizes(`${prevSize}px`, `${nextSize}px`);
    }

    private parseSizeInput(value: string | number | null | undefined): number | null {
        if (value === null || value === undefined || value === "") {
            return null;
        }
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : null;
        }
        const trimmed = value.trim().toLowerCase();
        const numeric = parseFloat(trimmed.replace("px", ""));
        return Number.isFinite(numeric) ? numeric : null;
    }

    private pickTargetPane(
        direction: "previous" | "next"
    ): (Omit<PaneElementData, "size"> & { direction: "previous" | "next" }) | null {
        const [previousElement, nextElement] = this.getPaneElements();
        const previousPane = this.previousPane();
        const nextPane = this.nextPane();

        if (direction === "previous") {
            if (nextPane.collapsible() && nextPane.collapsed()) {
                return { pane: nextPane, element: nextElement, direction: "next" };
            }
            return { pane: previousPane, element: previousElement, direction: "previous" };
        } else {
            if (previousPane.collapsible() && previousPane.collapsed()) {
                return { pane: previousPane, element: previousElement, direction: "previous" };
            }
            return { pane: nextPane, element: nextElement, direction: "next" };
        }
    }

    private setKeyboardEvents(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                const handled = this.handleKeydown(event);
                if (handled) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
    }

    private setPointerEvents(): void {
        const pointerDown$ = fromEvent<PointerEvent>(this.#hostElementRef.nativeElement, "pointerdown").pipe(
            filter(() => this.resizable()),
            tap(event => {
                event.preventDefault();
                this.#hostElementRef.nativeElement.setPointerCapture(event.pointerId);
                this.resizing.set(true);
            })
        );
        const pointerUp$ = fromEvent<PointerEvent>(this.#hostElementRef.nativeElement, "pointerup").pipe(
            tap(event => {
                this.#hostElementRef.nativeElement.releasePointerCapture(event.pointerId);
                this.resizing.set(false);
                this.setPointerEvents();
            })
        );

        const host = this.#hostElementRef.nativeElement;
        const pointerEnter$ = fromEvent<PointerEvent>(host, "pointerenter").pipe(map(() => true));
        const pointerLeave$ = fromEvent<PointerEvent>(host, "pointerleave").pipe(map(() => false));

        merge(pointerEnter$, pointerLeave$)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(isHovered => {
                this.hovered.set(isHovered);
            });

        fromEvent<PointerEvent>(document, "pointermove")
            .pipe(skipUntil(pointerDown$), takeUntil(pointerUp$))
            .subscribe(event => {
                this.ensureExpandedBeforeResize();
                const orientation = this.orientation();
                if (orientation === "horizontal") {
                    this.updateHorizontalPaneSizes(event);
                } else {
                    this.updateVerticalPaneSizes(event);
                }
            });
    }

    private togglePane(
        targetPane: SplitterPaneComponent,
        targetElement: HTMLElement,
        direction: "previous" | "next"
    ): void {
        const neighbors = this.getNeighborPanes(targetElement, direction);
        if (targetPane.collapsed()) {
            const storedSize = this.#paneSizeMemory.get(targetPane) ?? this.measurePaneSize(targetElement);
            this.expandPane(targetPane, storedSize, neighbors.leading, neighbors.trailing);
        } else {
            const targetSize = this.measurePaneSize(targetElement);
            this.#paneSizeMemory.set(targetPane, targetSize);
            this.collapseAndRedistribute(targetPane, targetSize, neighbors.leading, neighbors.trailing);
        }
    }

    private updateHorizontalPaneSizes(event: PointerEvent): void {
        const [previousRect, nextRect] = this.getPaneRectangles();
        const maxWidth = previousRect.width + nextRect.width;
        const desiredPrevWidth = Math.min(Math.max(event.clientX - previousRect.left, 0), maxWidth);
        const [previousPaneWidth, nextPaneWidth] = this.clampPaneSizes(
            maxWidth,
            desiredPrevWidth,
            this.previousPane(),
            this.nextPane()
        );
        this.updatePaneSizes(`${previousPaneWidth}px`, `${nextPaneWidth}px`);
    }

    private updatePaneSizes(previousPaneSize: string, nextPaneSize: string): void {
        this.previousPane().collapsed.set(false);
        this.nextPane().collapsed.set(false);
        this.previousPane().size.set(previousPaneSize);
        this.nextPane().size.set(nextPaneSize);
    }

    private updateVerticalPaneSizes(event: PointerEvent): void {
        const [previousRect, nextRect] = this.getPaneRectangles();
        const maxHeight = previousRect.height + nextRect.height;
        const desiredPrevHeight = Math.min(Math.max(event.clientY - previousRect.top, 0), maxHeight);
        const [previousPaneHeight, nextPaneHeight] = this.clampPaneSizes(
            maxHeight,
            desiredPrevHeight,
            this.previousPane(),
            this.nextPane()
        );
        this.updatePaneSizes(`${previousPaneHeight}px`, `${nextPaneHeight}px`);
    }
}
