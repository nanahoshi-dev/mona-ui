import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ButtonGroupDemoComponent } from "../../../demo/components/button-group-demo/button-group-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-button-group-doc",
    imports: [SectionComponent, ButtonGroupDemoComponent],
    templateUrl: "./button-group-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonGroupDocComponent {}
