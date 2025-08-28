import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { DropdownButtonDemoComponent } from "../../../demo/components/dropdown-button-demo/dropdown-button-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-dropdown-button-doc",
    imports: [SectionComponent, DropdownButtonDemoComponent, CodeViewerComponent],
    templateUrl: "./dropdown-button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownButtonDocComponent {
    protected readonly importCode = `
        import { DropdownButtonComponent, DropdownButtonItemComponent } from "mona-ui";
    `;
}
