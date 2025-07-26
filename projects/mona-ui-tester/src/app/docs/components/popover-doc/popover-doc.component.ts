import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { PopoverDemoComponent } from "../../../demo/components/popover-demo/popover-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-popover-doc",
    imports: [CodeViewerComponent, SectionComponent, PopoverDemoComponent],
    templateUrl: "./popover-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopoverDocComponent {
    protected readonly importCode = `import { PopoverComponent } from 'mona-ui';`;
}
