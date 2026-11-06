import { computed, Directive, input } from "@angular/core";
import { where } from "@mirei/ts-collections";
import type { SplitterPaneComponent } from "../components/splitter-pane/splitter-pane.component";
import type { SplitterVariantProps } from "../styles/splitter.styles";
import { parsePaneSizeLimit } from "../utils/pane-size";

@Directive({
    selector: "div[monaSplitterPaneStyle]",
    host: {
        "[style]": "styles()",
        "[attr.aria-hidden]": "isCollapsed() ? true : null",
        "[attr.inert]": "isCollapsed() ? true : null"
    }
})
export class SplitterPaneStyleDirective {
    readonly #autoSizedPane = computed(() => {
        const paneList = this.paneList();
        const panes = where(paneList, pane => !(pane.collapsible() && pane.collapsed()));
        if (!panes.any()) {
            return null;
        }
        return panes.firstOrDefault(pane => pane.size() === "") ?? panes.last();
    });
    protected readonly isCollapsed = computed(() => this.pane().collapsible() && this.pane().collapsed());
    protected readonly styles = computed(() => {
        const pane = this.pane();
        const flexBasis = this.getPaneFlexBasis(pane);
        const flexGrow = this.getPaneFlexGrow(pane);
        const flexShrink = this.getPaneFlexShrink(pane);
        const styles: Partial<CSSStyleDeclaration> = { flexGrow, flexShrink, flexBasis, ...this.getPaneLimits(pane) };
        return styles;
    });
    public readonly orientation = input<SplitterVariantProps["orientation"]>("horizontal");
    public readonly pane = input.required<SplitterPaneComponent>();
    public readonly paneList = input.required<Iterable<SplitterPaneComponent>>();

    protected getPaneFlexShrink(pane: SplitterPaneComponent): string {
        return pane.collapsible() && pane.collapsed() ? "0" : "1";
    }

    private getFractionalWeight(size: string | null): number | null {
        if (typeof size !== "string") {
            return null;
        }
        const match = size.trim().match(/^([0-9]*\.?[0-9]+)fr$/i);
        if (match === null) {
            return null;
        }
        const weight = Number(match[1]);
        return Number.isFinite(weight) ? weight : 1;
    }

    private getPaneFlexBasis(pane: SplitterPaneComponent): string {
        if (pane.collapsible() && pane.collapsed()) {
            return "0px";
        }
        const size = this.getPaneSize(pane);
        if (size === null || this.isFractionalSize(size)) {
            return "0px";
        }
        return size;
    }

    private getPaneFlexGrow(pane: SplitterPaneComponent): string {
        if (pane.collapsible() && pane.collapsed()) {
            return "0";
        }
        const size = this.getPaneSize(pane);
        const fractionalWeight = this.getFractionalWeight(size);
        if (fractionalWeight !== null) {
            return fractionalWeight.toString();
        }
        if (pane.uid === this.#autoSizedPane()?.uid) {
            return "1";
        }
        return size === null ? "1" : "0";
    }

    /** So the limits hold for first sizes and window resizes too, and not only for a drag. A collapsed pane has none. */
    private getPaneLimits(pane: SplitterPaneComponent): Partial<CSSStyleDeclaration> {
        if (pane.collapsible() && pane.collapsed()) {
            return {};
        }
        const min = parsePaneSizeLimit(pane.min());
        const max = parsePaneSizeLimit(pane.max());
        const minValue = min === null ? undefined : `${Math.max(0, min)}px`;
        const maxValue = max === null ? undefined : `${Math.max(0, max)}px`;
        return this.orientation() === "vertical"
            ? { minHeight: minValue, maxHeight: maxValue }
            : { minWidth: minValue, maxWidth: maxValue };
    }

    private getPaneSize(pane: SplitterPaneComponent): string | null {
        const size = pane.size();
        if (size === "" || size === undefined || size === null) {
            return null;
        }
        if (typeof size === "number") {
            return `${size}px`;
        }
        return size;
    }

    private isFractionalSize(size: string | null): boolean {
        if (typeof size !== "string") {
            return false;
        }
        return size.trim().toLowerCase().endsWith("fr");
    }
}
