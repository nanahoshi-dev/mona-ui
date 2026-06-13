import { Component, input, model, TemplateRef, viewChild, ChangeDetectionStrategy } from "@angular/core";
import { v4 } from "uuid";

@Component({
    selector: "mona-splitter-pane",
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        <ng-template>
            <ng-content></ng-content>
        </ng-template>
    `
})
export class SplitterPaneComponent {
    public readonly template = viewChild.required(TemplateRef);

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

    public readonly uid = v4();
}
