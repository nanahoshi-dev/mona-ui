import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ColorPickerDemoComponent } from "../../../demo/components/color-picker-demo/color-picker-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-color-picker-doc",
    imports: [ColorPickerDemoComponent, MarkdownDocComponent],
    templateUrl: "./color-picker-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPickerDocComponent {}
