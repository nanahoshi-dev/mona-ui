import { Component, computed, signal } from "@angular/core";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";

interface Topping {
    readonly name: string;
    readonly selected: boolean;
}

@Component({
    selector: "app-checkbox-indeterminate-example",
    imports: [CheckBoxComponent],
    templateUrl: "./indeterminate-example.component.html"
})
export class CheckboxIndeterminateExampleComponent {
    protected readonly allSelected = computed(() => this.toppings().every(topping => topping.selected));
    protected readonly someSelected = computed(
        () => !this.allSelected() && this.toppings().some(topping => topping.selected)
    );
    protected readonly toppings = signal<readonly Topping[]>([
        { name: "Cheese", selected: true },
        { name: "Mushrooms", selected: false },
        { name: "Olives", selected: false }
    ]);

    protected select(name: string, selected: boolean): void {
        this.toppings.update(toppings =>
            toppings.map(topping => (topping.name === name ? { ...topping, selected } : topping))
        );
    }

    protected selectAll(selected: boolean): void {
        this.toppings.update(toppings => toppings.map(topping => ({ ...topping, selected })));
    }
}
