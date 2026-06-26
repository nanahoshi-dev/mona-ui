import { ChangeDetectionStrategy, Component } from "@angular/core";
import { DropdownButtonDemoComponent } from "../../../demo/components/dropdown-button-demo/dropdown-button-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-dropdown-button-doc",
    imports: [DropdownButtonDemoComponent, MarkdownDocComponent],
    templateUrl: "./dropdown-button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownButtonDocComponent {}
