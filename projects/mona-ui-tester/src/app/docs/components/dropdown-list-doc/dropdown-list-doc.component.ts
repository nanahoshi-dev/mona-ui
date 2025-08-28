import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { DropdownListDemoComponent } from "../../../demo/components/dropdown-list-demo/dropdown-list-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-dropdown-list-doc",
    imports: [CodeViewerComponent, SectionComponent, DropdownListDemoComponent],
    templateUrl: "./dropdown-list-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownListDocComponent {
    protected readonly importCode = `import { DropdownListComponent } from "mona-ui";`;
}
