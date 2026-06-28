import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SliderDemoComponent } from "../../../demo/components/slider-demo/slider-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-slider-doc",
    imports: [SliderDemoComponent, MarkdownDocComponent],
    templateUrl: "./slider-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderDocComponent {}
