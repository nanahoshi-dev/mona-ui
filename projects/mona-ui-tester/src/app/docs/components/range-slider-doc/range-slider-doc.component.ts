import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RangeSliderDemoComponent } from "../../../demo/components/range-slider-demo/range-slider-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-range-slider-doc",
    imports: [RangeSliderDemoComponent, MarkdownDocComponent],
    templateUrl: "./range-slider-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeSliderDocComponent {}
