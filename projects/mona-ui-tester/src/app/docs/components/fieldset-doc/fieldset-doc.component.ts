import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";
import { FieldsetDemoComponent } from "../../../demo/components/fieldset-demo/fieldset-demo.component";

@Component({
    selector: "app-fieldset-doc",
    imports: [CodeViewerComponent, SectionComponent, FieldsetDemoComponent],
    templateUrl: "./fieldset-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldsetDocComponent {
    protected readonly importCode = `import { FieldsetComponent } from "mona-ui";`;
}
