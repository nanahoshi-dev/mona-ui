import { ChangeDetectionStrategy, Component } from "@angular/core";
import { DropdownListDemoComponent } from "../../../demo/components/dropdown-list-demo/dropdown-list-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-dropdown-list-doc",
    imports: [DropdownListDemoComponent, MarkdownDocComponent],
    templateUrl: "./dropdown-list-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownListDocComponent {}
