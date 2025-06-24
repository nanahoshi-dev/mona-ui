import { ChangeDetectionStrategy, Component } from "@angular/core";
import { PageComponent } from "../page/page.component";

@Component({
    selector: "app-components",
    imports: [PageComponent],
    templateUrl: "./components.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComponentsComponent {}
