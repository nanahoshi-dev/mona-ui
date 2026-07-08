import { Component, input, model, TemplateRef, viewChild } from "@angular/core";
import { v4 } from "uuid";

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
     * @description Whether the pane is collapsible.
     */
    public readonly collapsible = input(false);

    /**
     * @description Whether the pane is collapsed.
     */
    public readonly collapsed = model(false);

    /**
     * @description The maximum size of the pane.
     */
    public readonly max = input<string | number | null>(null);

    /**
     * @description The minimum size of the pane.
     */
    public readonly min = input<string | number | null>(null);

    /**
     * @description Whether the pane is resizable.
     */
    public readonly resizable = input(true);

    /**
     * @description The size of the pane.
     */
    public readonly size = model<string | number>("");

    public readonly template = viewChild.required(TemplateRef);

    public readonly uid = v4();
}
