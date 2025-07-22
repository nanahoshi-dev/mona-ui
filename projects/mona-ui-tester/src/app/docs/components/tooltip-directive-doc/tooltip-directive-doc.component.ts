import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { TooltipDirectiveDemoComponent } from "../../../demo/components/tooltip-directive-demo/tooltip-directive-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-tooltip-directive-doc",
    imports: [SectionComponent, CodeViewerComponent, TooltipDirectiveDemoComponent],
    templateUrl: "./tooltip-directive-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipDirectiveDocComponent {
    protected readonly importCode = `import { TooltipDirective } from "mona-ui";`;
}
