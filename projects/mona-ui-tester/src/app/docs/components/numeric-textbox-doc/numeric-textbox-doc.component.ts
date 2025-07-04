import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { NumericTextboxDemoComponent } from "../../../demo/components/numeric-textbox-demo/numeric-textbox-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-numeric-textbox-doc",
    imports: [CodeViewerComponent, SectionComponent, NumericTextboxDemoComponent],
    templateUrl: "./numeric-textbox-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumericTextboxDocComponent {
    protected readonly importCode = `
        import { NumericTextboxComponent } from "mona-ui";
    `;
}
