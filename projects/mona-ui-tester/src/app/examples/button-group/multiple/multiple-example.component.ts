import { Component, computed, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";

@Component({
    selector: "app-button-group-multiple-example",
    imports: [ButtonDirective, ButtonGroupComponent],
    templateUrl: "./multiple-example.component.html"
})
export class ButtonGroupMultipleExampleComponent {
    protected readonly formatting = signal<string | readonly string[] | null | undefined>(["bold"]);
    protected readonly summary = computed(() => {
        const value = this.formatting();
        return Array.isArray(value) && value.length > 0 ? value.join(", ") : "none";
    });
}
