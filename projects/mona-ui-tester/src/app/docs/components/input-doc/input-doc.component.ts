import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { InputDemoComponent } from "../../../demo/components/input-demo/input-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-input-doc",
    imports: [CodeViewerComponent, SectionComponent, RouterLink, InputDemoComponent],
    templateUrl: "./input-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputDocComponent {
    protected readonly importCode = `
        import { TextBoxDirective } from "mona-ui";
    `;
}
