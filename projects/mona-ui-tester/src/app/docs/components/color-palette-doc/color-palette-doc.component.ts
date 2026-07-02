import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ColorPaletteDemoComponent } from "../../../demo/components/color-palette-demo/color-palette-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-color-palette-doc",
    imports: [ColorPaletteDemoComponent, MarkdownDocComponent],
    templateUrl: "./color-palette-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPaletteDocComponent {}
