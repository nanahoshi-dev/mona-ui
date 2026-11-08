import { Component, signal } from "@angular/core";
import {
    SplitButtonCheckboxItemComponent,
    SplitButtonComponent,
    SplitButtonRadioGroupComponent,
    SplitButtonRadioItemComponent,
    SplitButtonSeparatorComponent
} from "@nanahoshi/mona-ui/split-button";

@Component({
    selector: "app-split-button-checkable-example",
    imports: [
        SplitButtonCheckboxItemComponent,
        SplitButtonComponent,
        SplitButtonRadioGroupComponent,
        SplitButtonRadioItemComponent,
        SplitButtonSeparatorComponent
    ],
    templateUrl: "./checkable-example.component.html"
})
export class SplitButtonCheckableExampleComponent {
    protected readonly format = signal("pdf");
    protected readonly includeComments = signal(false);
    protected readonly lastExport = signal("none");

    protected export(): void {
        this.lastExport.set(`${this.format().toUpperCase()}${this.includeComments() ? " with comments" : ""}`);
    }
}
