import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { TooltipDemoComponent } from "../../../demo/components/tooltip-demo/tooltip-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-tooltip-doc",
    imports: [CodeViewerComponent, SectionComponent, TooltipDemoComponent],
    templateUrl: "./tooltip-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipDocComponent {
    protected readonly importCode = `import { TooltipComponent } from "mona-ui";`;
}
