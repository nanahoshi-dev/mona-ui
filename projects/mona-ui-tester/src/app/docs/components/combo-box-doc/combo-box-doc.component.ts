import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { ComboBoxDemoComponent } from "../../../demo/components/combo-box-demo/combo-box-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-combo-box-doc",
    imports: [CodeViewerComponent, SectionComponent, ComboBoxDemoComponent],
    templateUrl: "./combo-box-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComboBoxDocComponent {
    protected readonly importCode = `import { ComboBoxComponent } from "mona-ui";`;
}
