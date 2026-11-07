import { Component, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";

@Component({
    selector: "app-button-group-forms-example",
    imports: [ButtonDirective, ButtonGroupComponent, FormField],
    templateUrl: "./forms-example.component.html"
})
export class ButtonGroupFormsExampleComponent {
    readonly #model = signal<{ align: string | null }>({ align: "left" });
    protected readonly paragraph = form(this.#model);
}
