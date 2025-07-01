import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { TextAreaDemoComponent } from "../../../demo/components/text-area-demo/text-area-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-text-area-doc",
    imports: [CodeViewerComponent, SectionComponent, TextAreaDemoComponent],
    templateUrl: "./text-area-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextAreaDocComponent {
    protected readonly importCode = `
        import { TextAreaDirective } from "mona-ui";
    `;
}
