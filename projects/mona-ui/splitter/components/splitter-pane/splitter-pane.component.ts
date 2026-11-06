import { booleanAttribute, Component, input, model, TemplateRef, viewChild } from "@angular/core";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";

@Component({
    selector: "mona-splitter-pane",
    template: `
        <ng-template>
            <ng-content></ng-content>
        </ng-template>
    `
})
export class SplitterPaneComponent {
    /**
     * @description Whether the pane is collapsed.
     */
    public readonly collapsed = model(false);

    /**
     * @description Whether the pane is collapsible.
     */
    public readonly collapsible = input(false, { transform: booleanAttribute });

    /**
     * @description Names the separator after this pane, for assistive technology. Without it, the separator has a generic
     * name, which can't tell one from another when a splitter has several.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @description The maximum size of the pane, in pixels. A number or a string like `"200px"`. Percentages aren't
     * supported, and are ignored with a warning in development.
     */
    public readonly max = input<string | number | null>(null);

    /**
     * @description The minimum size of the pane, in pixels. A number or a string like `"200px"`. Percentages aren't
     * supported, and are ignored with a warning in development.
     */
    public readonly min = input<string | number | null>(null);

    /**
     * @description Whether the pane is resizable. A separator only moves, by pointer or key, when the panes on both of its
     * sides are.
     */
    public readonly resizable = input(true, { transform: booleanAttribute });

    /**
     * @description The size of the pane.
     */
    public readonly size = model<string | number>("");

    public readonly template = viewChild.required(TemplateRef);

    public readonly uid = createElementControlId();
}
