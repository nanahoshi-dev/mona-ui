import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DropdownListDemoComponent } from "../../../demo/components/dropdown-list-demo/dropdown-list-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-dropdown-list-doc",
    imports: [ApiSectionComponent, DropdownListDemoComponent, MarkdownDocComponent],
    templateUrl: "./dropdown-list-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownListDocComponent {}
