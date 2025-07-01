import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CheckboxDemoComponent } from "../../../demo/components/checkbox-demo/checkbox-demo.component";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-checkbox-doc",
    imports: [CodeViewerComponent, SectionComponent, CheckboxDemoComponent],
    templateUrl: "./checkbox-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxDocComponent {
    protected readonly importCode = `
        import { CheckboxComponent } from "mona-ui";
    `;
}
