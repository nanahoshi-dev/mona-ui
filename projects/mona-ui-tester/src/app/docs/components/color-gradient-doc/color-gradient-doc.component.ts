import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { ColorGradientDemoComponent } from "../../../demo/components/color-gradient-demo/color-gradient-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-color-gradient-doc",
    imports: [SectionComponent, CodeViewerComponent, ColorGradientDemoComponent],
    templateUrl: "./color-gradient-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorGradientDocComponent {
    protected readonly importCode = `import { ColorGradientComponent } from "mona-ui";`;
}
