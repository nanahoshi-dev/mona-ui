import { computed, Directive, input } from "@angular/core";
import { where } from "@mirei/ts-collections";
import { SplitterPaneComponent } from "../components/splitter-pane/splitter-pane.component";

@Directive({
    selector: "div[monaSplitterPaneStyle]",
    host: {
        "[style]": "styles()",
        "[aria-hidden]": "pane().collapsible() && pane().collapsed()"
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
    protected readonly styles = computed(() => {
        const pane = this.pane();
        const flexBasis = this.getPaneFlexBasis(pane);
        const flexGrow = this.getPaneFlexGrow(pane);
        const flexShrink = this.getPaneFlexShrink(pane);
        const styles: Partial<CSSStyleDeclaration> = { flexGrow, flexShrink, flexBasis };
        return styles;
    });
    public readonly pane = input.required<SplitterPaneComponent>();
    public readonly paneList = input.required<Iterable<SplitterPaneComponent>>();

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

    protected getPaneFlexShrink(pane: SplitterPaneComponent): string {
        return pane.collapsible() && pane.collapsed() ? "0" : "1";
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
