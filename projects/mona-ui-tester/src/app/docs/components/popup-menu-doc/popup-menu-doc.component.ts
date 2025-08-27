import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PopupMenuDemoComponent } from "../../../demo/components/popup-menu-demo/popup-menu-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-popup-menu-doc",
    imports: [SectionComponent, PopupMenuDemoComponent],
    templateUrl: "./popup-menu-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupMenuDocComponent {}
