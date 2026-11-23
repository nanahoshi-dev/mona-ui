import { Component, signal } from "@angular/core";
import { ChipComponent } from "@nanahoshi/mona-ui/chip";
import { ListBoxComponent } from "@nanahoshi/mona-ui/list-box";
import { RIPPLE_OPTIONS } from "@nanahoshi/mona-ui/ripple";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";

@Component({
    selector: "app-ripple-components-example",
    imports: [ChipComponent, ListBoxComponent, TabComponent, TabContentTemplateDirective, TabsComponent],
    // Turns ripples on for this example only. An application turns them on everywhere with provideRipple().
    providers: [{ provide: RIPPLE_OPTIONS, useValue: { enabled: true } }],
    templateUrl: "./components-example.component.html"
})
export class RippleComponentsExampleComponent {
    protected readonly fruits = [
        { id: 1, name: "Apple" },
        { id: 2, name: "Banana" },
        { id: 3, name: "Cherry" },
        { id: 4, name: "Grape" }
    ];
    protected readonly open = signal(true);
    protected readonly selectedIds = signal<number[]>([2]);
    protected readonly urgent = signal(false);
}
