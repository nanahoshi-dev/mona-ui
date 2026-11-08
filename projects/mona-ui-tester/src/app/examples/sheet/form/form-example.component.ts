import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SheetComponent } from "@nanahoshi/mona-ui/sheet";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-sheet-form-example",
    imports: [ButtonDirective, LabelComponent, SheetComponent, TextBoxComponent],
    templateUrl: "./form-example.component.html"
})
export class SheetFormExampleComponent {
    protected readonly draft = signal("");
    protected readonly name = signal("Grace Hopper");
    protected readonly open = signal(false);

    protected edit(): void {
        this.draft.set(this.name());
        this.open.set(true);
    }

    protected save(): void {
        this.name.set(this.draft());
        this.open.set(false);
    }
}
