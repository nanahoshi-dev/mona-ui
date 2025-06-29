import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ChipDemoComponent } from "../../../demo/components/chip-demo/chip-demo.component";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-chip-doc",
    imports: [SectionComponent, ChipDemoComponent, CodeViewerComponent],
    templateUrl: "./chip-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipDocComponent {
    protected readonly importCode = `
        import { ChipComponent } from "mona-ui";
    `;
}
