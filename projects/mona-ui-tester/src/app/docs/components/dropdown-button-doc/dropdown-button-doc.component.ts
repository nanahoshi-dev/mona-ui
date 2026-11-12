import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DropdownButtonDemoComponent } from "../../../demo/components/dropdown-button-demo/dropdown-button-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-dropdown-button-doc",
    imports: [ApiSectionComponent, DropdownButtonDemoComponent, MarkdownDocComponent],
    templateUrl: "./dropdown-button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownButtonDocComponent {}
