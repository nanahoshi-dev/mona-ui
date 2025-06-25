import { ChangeDetectionStrategy, Component } from "@angular/core";
import { SplitButtonDemoComponent } from "../../../demo/components/split-button-demo/split-button-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-split-button-doc",
    imports: [SectionComponent, SplitButtonDemoComponent],
    templateUrl: "./split-button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplitButtonDocComponent {}
