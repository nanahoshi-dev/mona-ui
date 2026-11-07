import { Component, signal } from "@angular/core";
import {
    MenubarComponent,
    MenuComponent,
    MenuGroupComponent,
    MenuItemComponent,
    MenuSeparatorComponent
} from "@nanahoshi/mona-ui/menubar";

@Component({
    selector: "app-menubar-basic-example",
    imports: [MenubarComponent, MenuComponent, MenuGroupComponent, MenuItemComponent, MenuSeparatorComponent],
    templateUrl: "./basic-example.component.html"
})
export class MenubarBasicExampleComponent {
    protected readonly lastAction = signal("none");
}
