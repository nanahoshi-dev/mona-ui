import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SwitchDemoComponent } from "../../../demo/components/switch-demo/switch-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-switch-doc",
    imports: [CodeViewerComponent, SectionComponent, SwitchDemoComponent],
    templateUrl: "./switch-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchDocComponent {
    protected readonly importCode = `
        import { SwitchComponent } from "mona-ui";
    `;
}
