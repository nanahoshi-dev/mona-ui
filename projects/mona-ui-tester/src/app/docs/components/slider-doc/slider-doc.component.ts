import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SliderDemoComponent } from "../../../demo/components/slider-demo/slider-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-slider-doc",
    imports: [CodeViewerComponent, SectionComponent, SliderDemoComponent],
    templateUrl: "./slider-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderDocComponent {
    protected readonly importCode = `import { SliderComponent } from "mona-ui";`;
}
