import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { TextBoxDemoComponent } from "../../../demo/components/text-box-demo/text-box-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-text-box-doc",
    imports: [CodeViewerComponent, SectionComponent, TextBoxDemoComponent],
    templateUrl: "./text-box-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextBoxDocComponent {
    protected readonly importCode = `
        import { TextBoxComponent } from "mona-ui";
    `;
}
