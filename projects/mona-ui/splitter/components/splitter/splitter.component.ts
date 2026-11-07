import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChildren, input, numberAttribute, output } from "@angular/core";
import { from } from "@mirei/ts-collections";
import { SplitterPaneStyleDirective } from "../../directives/splitter-pane-style.directive";
import type { SplitterVariantInput, SplitterVariantProps } from "../../styles/splitter.styles";
import { splitterBaseThemeVariants } from "../../styles/splitter.styles";
import { SplitterPaneComponent } from "../splitter-pane/splitter-pane.component";
import { SplitterResizerComponent } from "../splitter-resizer/splitter-resizer.component";

@Component({
    selector: "mona-splitter",
    imports: [SplitterResizerComponent, NgTemplateOutlet, SplitterPaneStyleDirective],
    templateUrl: "./splitter.component.html",
    host: {
        "[class]": "baseClass()"
    }
})
export class SplitterComponent implements SplitterVariantInput {
    protected readonly baseClass = computed(() => {
        const orientation = this.orientation();
        return splitterBaseThemeVariants({ orientation });
    });
    protected readonly paneList = contentChildren(SplitterPaneComponent);

    /**
     * @description How far an arrow key moves a separator, in pixels.
     * @default 10
     */
    public readonly keyboardStep = input(10, { transform: numberAttribute });

    /**
     * @description The layout direction of the splitter panes.
     * @default "horizontal"
     */
    public readonly orientation = input<SplitterVariantProps["orientation"]>("horizontal");

    /**
     * @description Emitted with every pane's `size`, in order, once a drag ends, after each key that resizes, and when the
     * separator collapses or expands a pane. Use it to save a layout: `sizeChange` on a pane fires on every move, and these
     * values can go straight back into `size`.
     */
    public readonly resizeEnd = output<readonly (string | number)[]>();

    /**
     * @internal Used by SplitterResizerComponent to resolve sibling panes by id.
     */
    public getPaneByUid(uid: string): SplitterPaneComponent | null {
        return from(this.paneList()).firstOrDefault(pane => pane.uid === uid);
    }

    /**
     * @internal Used by SplitterResizerComponent when a resize has finished.
     */
    public notifyResizeEnd(): void {
        this.resizeEnd.emit(this.paneList().map(pane => pane.size()));
    }
}
