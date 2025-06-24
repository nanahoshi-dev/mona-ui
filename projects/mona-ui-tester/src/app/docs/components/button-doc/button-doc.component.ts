import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ButtonDemoComponent } from "../../../demo/components/button-demo/button-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-button-doc",
    imports: [SectionComponent, ButtonDemoComponent],
    templateUrl: "./button-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonDocComponent {}
