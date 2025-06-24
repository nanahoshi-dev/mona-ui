import { Component } from "@angular/core";
import { ButtonDemoComponent } from "../../../demo/components/button-demo/button-demo.component";
import { ChipDemoComponent } from "../../../demo/components/chip-demo/chip-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-chip-doc",
    imports: [SectionComponent, ButtonDemoComponent, ChipDemoComponent],
    templateUrl: "./chip-doc.component.html"
})
export class ChipDocComponent {}
