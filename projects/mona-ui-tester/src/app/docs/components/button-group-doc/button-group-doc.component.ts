import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ButtonGroupDemoComponent } from "../../../demo/components/button-group-demo/button-group-demo.component";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-button-group-doc",
    imports: [SectionComponent, ButtonGroupDemoComponent, CodeViewerComponent],
    templateUrl: "./button-group-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonGroupDocComponent {
    protected readonly importCode = `
        import { ButtonGroupComponent, ButtonGroupItemComponent } from "mona-ui";
    `;
}
