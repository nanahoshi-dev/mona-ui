import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { ColorPaletteDemoComponent } from "../../../demo/components/color-palette-demo/color-palette-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-color-palette-doc",
    imports: [CodeViewerComponent, SectionComponent, ColorPaletteDemoComponent],
    templateUrl: "./color-palette-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPaletteDocComponent {
    protected readonly importCode = `import { ColorPaletteComponent } from "mona-ui";`;
}
