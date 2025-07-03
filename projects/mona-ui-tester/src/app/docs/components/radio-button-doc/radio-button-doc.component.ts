import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { RadioButtonDemoComponent } from "../../../demo/components/radio-button-demo/radio-button-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-radio-button-doc",
    imports: [CodeViewerComponent, SectionComponent, RadioButtonDemoComponent],
    templateUrl: "./radio-button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioButtonDocComponent {
    protected readonly importCode = `
        import { RadioButtonComponent } from "mona-ui";
    `;
}
