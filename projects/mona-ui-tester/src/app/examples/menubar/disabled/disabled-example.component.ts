import { Component, signal } from "@angular/core";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { MenubarComponent, MenuComponent, MenuItemComponent } from "@nanahoshi/mona-ui/menubar";

@Component({
    selector: "app-menubar-disabled-example",
    imports: [CheckBoxComponent, MenubarComponent, MenuComponent, MenuItemComponent],
    templateUrl: "./disabled-example.component.html"
})
export class MenubarDisabledExampleComponent {
    protected readonly hasSelection = signal(false);
}
