import type { ElementRef } from "@angular/core";
import {
    afterNextRender,
    afterRenderEffect,
    Component,
    computed,
    DestroyRef,
    ElementRef as ElementRefToken,
    inject,
    input,
    signal,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { compact } from "@mirei/ts-collections";
import { filter, finalize, fromEvent, merge, take, takeUntil, tap } from "rxjs";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { SPLITTER_DEFAULT_MESSAGES } from "../../i18n/splitter.default-messages";
import type { SplitterVariantProps } from "../../styles/splitter.styles";
import { splitterResizerThemeVariants, splitterSeparatorThemeVariants } from "../../styles/splitter.styles";
import { parsePaneSizeLimit } from "../../utils/pane-size";
import { SplitterPaneComponent } from "../splitter-pane/splitter-pane.component";
import { SplitterResizerHandleComponent } from "../splitter-resizer-handle/splitter-resizer-handle.component";
import { SplitterComponent } from "../splitter/splitter.component";

interface PaneElementData {
    element: HTMLElement;
    pane: SplitterPaneComponent;
    size: number;
}

@Component({
    selector: "mona-splitter-resizer",
    templateUrl: "./splitter-resizer.component.html",
    imports: [SplitterResizerHandleComponent],
    host: {
        "[class]": "baseClass()",
        "(focusin)": "focused.set(true)",
        "(focusout)": "onFocusOut($event)",
        "(pointerenter)": "hovered.set(true)",
        "(pointerleave)": "hovered.set(false)"
    }
})
export class SplitterResizerComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRefToken);
    readonly #i18n = inject(MonaI18nService);
    readonly #paneSizeMemory = new WeakMap<SplitterPaneComponent, number>();
    readonly #splitter = inject(SplitterComponent);
    protected readonly ariaValueMax = signal(0);
    protected readonly ariaValueMin = signal(0);
    protected readonly ariaValueNow = signal(0);
    protected readonly baseClass = computed(() => {
        return splitterResizerThemeVariants({ orientation: this.orientation() });
    });
    protected readonly controlsVisible = computed(() => this.hovered() || this.focused());
    protected readonly cursor = computed(() => {
        if (!this.resizable()) {
            return "auto";
        }
        return this.orientation() === "horizontal" ? "ew-resize" : "ns-resize";
    });
    protected readonly focused = signal(false);
    protected readonly hovered = signal(false);
    protected readonly isInert = computed(() => {
        return !this.resizable() && this.getCollapsibleTargetPane() === null;
    });
    protected readonly isRtl = computed(() => this.#direction() === "rtl");
    protected readonly messages = this.#i18n.componentMessages("splitter", SPLITTER_DEFAULT_MESSAGES);
    protected readonly nextCollapseControlsVisible = computed(() => {
        return this.controlsVisible() && this.nextPane().collapsible() && !this.nextPane().collapsed();
    });
    protected readonly previousCollapseControlsVisible = computed(() => {
        return this.controlsVisible() && this.previousPane().collapsible() && !this.previousPane().collapsed();
    });
    protected readonly resizable = computed(() => {
        return this.previousPane().resizable() && this.nextPane().resizable();
    });
    protected readonly resizing = signal(false);
    protected readonly separatorClass = computed(() => {
        return splitterSeparatorThemeVariants({ orientation: this.orientation(), resizing: this.resizing() });
    });
    protected readonly separatorElement = viewChild.required<ElementRef<HTMLElement>>("separator");
    /** The way the bar runs, which is across the way the panes are laid out. */
    protected readonly separatorOrientation = computed(() => {
        return this.orientation() === "horizontal" ? "vertical" : "horizontal";
    });

    public readonly nextPane = input.required<SplitterPaneComponent>();
    public readonly orientation = input.required<SplitterVariantProps["orientation"]>();
    public readonly previousPane = input.required<SplitterPaneComponent>();

    public constructor() {
        afterNextRender({
            read: () => this.observePaneSizes()
        });
        afterRenderEffect({
            read: () => {
                this.previousPane().size();
                this.previousPane().collapsed();
                this.nextPane().size();
                this.nextPane().collapsed();
                this.updateAriaSeparatorValues();
            }
        });
    }

    /** Focus goes to the separator first, because the button that was activated goes away with the pane. */
    protected collapseNext(): void {
        this.separatorElement().nativeElement.focus();
        this.collapsePane("next");
    }

    protected collapsePrevious(): void {
        this.separatorElement().nativeElement.focus();
        this.collapsePane("previous");
    }

    protected onFocusOut(event: FocusEvent): void {
        this.focused.set(this.#hostElementRef.nativeElement.contains(event.relatedTarget as Node | null));
    }

    protected onKeydown(event: KeyboardEvent): void {
        if (this.handleKeydown(event)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    /** Listens only for the length of the drag, so nothing is left behind on the document in between. */
    protected onPointerDown(event: PointerEvent): void {
        if (!this.resizable() || event.button !== 0 || this.resizing()) {
            return;
        }
        // Cancelling this also cancels the mouse events that would have moved focus, so it's moved here.
        event.preventDefault();
        const separator = this.separatorElement().nativeElement;
        separator.focus({ preventScroll: true });
        const { pointerId } = event;
        const isDragPointer = (other: PointerEvent): boolean => other.pointerId === pointerId;
        separator.setPointerCapture(pointerId);
        this.resizing.set(true);

        let moved = false;
        const dragEnd$ = merge(
            fromEvent<PointerEvent>(separator, "pointerup"),
            fromEvent<PointerEvent>(separator, "pointercancel"),
            fromEvent<PointerEvent>(separator, "lostpointercapture")
        ).pipe(
            filter(isDragPointer),
            take(1),
            tap(() => {
                if (moved) {
                    this.#splitter.notifyResizeEnd();
                }
            })
        );
        fromEvent<PointerEvent>(separator.ownerDocument, "pointermove")
            .pipe(
                filter(isDragPointer),
                takeUntil(dragEnd$),
                takeUntilDestroyed(this.#destroyRef),
                finalize(() => {
                    this.resizing.set(false);
                    if (separator.hasPointerCapture(pointerId)) {
                        separator.releasePointerCapture(pointerId);
                    }
                })
            )
            .subscribe(move => {
                moved = true;
                this.ensureExpandedBeforeResize();
                if (this.orientation() === "horizontal") {
                    this.updateHorizontalPaneSizes(move);
                } else {
                    this.updateVerticalPaneSizes(move);
                }
            });
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
            // Nothing to hand out, as when the splitter sits in a hidden tab, but the pane still collapses.
            targetPane.collapsed.set(true);
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

    private collapsePane(direction: "previous" | "next"): boolean {
        const target = this.pickTargetPane(direction);
        if (target === null || !target.pane.collapsible()) {
            return false;
        }
        this.togglePane(target.pane, target.element, target.direction);
        return true;
    }

    private distributeSpaceToNeighbors(space: number, neighbors: PaneElementData[]): void {
        const remaining = space;
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

        const available = capacities.reduce((sum, c) => sum + c.capacity, 0);
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
        const parsed = parsePaneSizeLimit(max);
        return parsed === null ? Number.POSITIVE_INFINITY : Math.max(0, parsed);
    }

    private getMinSize(pane: SplitterPaneComponent): number {
        const min = pane.min();
        const parsed = parsePaneSizeLimit(min);
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
            const isRtl = this.isRtl();
            if (key === "ArrowLeft") {
                return this.collapsePane(isRtl ? "next" : "previous");
            }
            if (key === "ArrowRight") {
                return this.collapsePane(isRtl ? "previous" : "next");
            }
        } else {
            if (key === "ArrowUp") {
                return this.collapsePane("previous");
            }
            if (key === "ArrowDown") {
                return this.collapsePane("next");
            }
        }
        return false;
    }

    private handleKeydown(event: KeyboardEvent): boolean {
        const key = event.key;
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
            return false;
        }

        if (event.altKey) {
            return this.handleCollapserKeys(key);
        }

        if (key === "Enter") {
            if (this.getCollapsibleTargetPane() === null) {
                return false;
            }
            this.toggleCollapse();
            return true;
        }
        return this.handleResizerKeys(key);
    }

    private handleResizerKeys(key: string): boolean {
        if (!this.resizable()) {
            return false;
        }
        const step = this.#splitter.keyboardStep();
        if (key === "Home") {
            this.resizeFromKey(Number.NEGATIVE_INFINITY);
            return true;
        }
        if (key === "End") {
            this.resizeFromKey(Number.POSITIVE_INFINITY);
            return true;
        }
        if (this.orientation() === "horizontal") {
            const isRtl = this.isRtl();
            if (key === "ArrowLeft") {
                this.resizeFromKey(isRtl ? step : -step);
                return true;
            }
            if (key === "ArrowRight") {
                this.resizeFromKey(isRtl ? -step : step);
                return true;
            }
        } else {
            if (key === "ArrowUp") {
                this.resizeFromKey(-step);
                return true;
            }
            if (key === "ArrowDown") {
                this.resizeFromKey(step);
                return true;
            }
        }
        return false;
    }

    private isCollapsed(pane: SplitterPaneComponent): boolean {
        return pane.collapsible() && pane.collapsed();
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

    /** So the separator's value follows the panes when the container resizes or a hidden tab is shown. */
    private observePaneSizes(): void {
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(() => this.updateAriaSeparatorValues());
        this.getPaneElements().forEach(element => observer.observe(element));
        this.#destroyRef.onDestroy(() => observer.disconnect());
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

    /**
     * A key on a collapsed pane brings it back at the size it had, or does nothing when the key points further into it.
     * Resizing from there would leave it at a single step and lose that size.
     */
    private resizeFromKey(delta: number): void {
        const previousPane = this.previousPane();
        const nextPane = this.nextPane();
        const [previousElement, nextElement] = this.getPaneElements();
        if (this.isCollapsed(previousPane)) {
            if (delta <= 0) {
                return;
            }
            this.togglePane(previousPane, previousElement, "previous");
        } else if (this.isCollapsed(nextPane)) {
            if (delta >= 0) {
                return;
            }
            this.togglePane(nextPane, nextElement, "next");
        } else {
            this.nudgeSplitter(delta);
        }
        this.#splitter.notifyResizeEnd();
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
            if (targetSize > 0) {
                this.#paneSizeMemory.set(targetPane, targetSize);
            }
            this.collapseAndRedistribute(targetPane, targetSize, neighbors.leading, neighbors.trailing);
        }
    }

    private updateAriaSeparatorValues(): void {
        const [previousRect, nextRect] = this.getPaneRectangles();
        const orientation = this.orientation();
        const previousSize = orientation === "horizontal" ? previousRect.width : previousRect.height;
        const nextSize = orientation === "horizontal" ? nextRect.width : nextRect.height;
        const total = previousSize + nextSize;
        const previousMin = this.getMinSize(this.previousPane());
        const nextMin = this.getMinSize(this.nextPane());
        const previousMaxRaw = this.getMaxSize(this.previousPane());
        const previousMax = Math.min(previousMaxRaw, total - nextMin);
        this.ariaValueMax.set(Math.round(Number.isFinite(previousMax) ? previousMax : total));
        this.ariaValueMin.set(Math.round(previousMin));
        this.ariaValueNow.set(Math.round(previousSize));
    }

    private updateHorizontalPaneSizes(event: PointerEvent): void {
        const [previousRect, nextRect] = this.getPaneRectangles();
        const maxWidth = previousRect.width + nextRect.width;
        const isRtl = this.isRtl();
        const desiredPrevWidth = isRtl
            ? Math.min(Math.max(previousRect.right - event.clientX, 0), maxWidth)
            : Math.min(Math.max(event.clientX - previousRect.left, 0), maxWidth);
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
