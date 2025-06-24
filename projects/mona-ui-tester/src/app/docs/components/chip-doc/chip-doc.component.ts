import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ChipDemoComponent } from "../../../demo/components/chip-demo/chip-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-chip-doc",
    imports: [SectionComponent, ChipDemoComponent],
    templateUrl: "./chip-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipDocComponent {}
