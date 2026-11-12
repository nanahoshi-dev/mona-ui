import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ColorPaletteDemoComponent } from "../../../demo/components/color-palette-demo/color-palette-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-color-palette-doc",
    imports: [ApiSectionComponent, ColorPaletteDemoComponent, MarkdownDocComponent],
    templateUrl: "./color-palette-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPaletteDocComponent {}
