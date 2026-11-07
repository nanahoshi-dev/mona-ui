import { Component, computed, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { PopoverComponent } from "@nanahoshi/mona-ui/popover";

@Component({
    selector: "app-popover-no-title-example",
    imports: [ButtonDirective, CheckBoxComponent, PopoverComponent],
    templateUrl: "./no-title-example.component.html"
})
export class PopoverNoTitleExampleComponent {
    protected readonly activeCount = computed(() => [this.open(), this.assignedToMe()].filter(Boolean).length);
    protected readonly assignedToMe = signal(false);
    protected readonly open = signal(true);
}
