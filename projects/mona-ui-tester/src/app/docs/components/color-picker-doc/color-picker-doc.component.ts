import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { ColorPickerDemoComponent } from "../../../demo/components/color-picker-demo/color-picker-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-color-picker-doc",
    imports: [CodeViewerComponent, SectionComponent, ColorPickerDemoComponent],
    templateUrl: "./color-picker-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPickerDocComponent {
    protected readonly importCode = `import { ColorPickerComponent } from "mona-ui";`;
}
