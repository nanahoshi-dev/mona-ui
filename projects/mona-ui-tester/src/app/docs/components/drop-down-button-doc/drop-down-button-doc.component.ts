import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { DropDownButtonDemoComponent } from "../../../demo/components/drop-down-button-demo/drop-down-button-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-drop-down-button-doc",
    imports: [SectionComponent, DropDownButtonDemoComponent, CodeViewerComponent],
    templateUrl: "./drop-down-button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropDownButtonDocComponent {
    protected readonly importCode = `
        import { DropDownButtonComponent, MenuItemComponent } from "mona-ui";
    `;
}
