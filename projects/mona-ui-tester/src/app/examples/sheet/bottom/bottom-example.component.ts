import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SheetComponent } from "@nanahoshi/mona-ui/sheet";

@Component({
    selector: "app-sheet-bottom-example",
    imports: [ButtonDirective, SheetComponent],
    templateUrl: "./bottom-example.component.html"
})
export class SheetBottomExampleComponent {
    protected readonly categories = ["Books", "Music", "Games", "Electronics", "Garden"];
    protected readonly open = signal(false);
}
