import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ColorGradientDemoComponent } from "../../../demo/components/color-gradient-demo/color-gradient-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-color-gradient-doc",
    imports: [ApiSectionComponent, ColorGradientDemoComponent, MarkdownDocComponent],
    templateUrl: "./color-gradient-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorGradientDocComponent {}
