import { ChangeDetectionStrategy, Component, computed, input, model } from "@angular/core";
import { ChevronDownIcon, ChevronRightIcon, LucideAngularModule, MinusIcon, PlusIcon } from "lucide-angular";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";

@Component({
    selector: "mona-grid-toggle",
    imports: [ButtonDirective, LucideAngularModule],
    templateUrl: "./grid-toggle.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridToggleComponent {
    protected readonly collapseIcon = computed(() => {
        const type = this.type();
        return type === "detail" ? MinusIcon : ChevronDownIcon;
    });
    protected readonly expandIcon = computed(() => {
        const type = this.type();
        return type === "detail" ? PlusIcon : ChevronRightIcon;
    });

    public readonly expanded = model.required<boolean>();
    public readonly type = input.required<"detail" | "group">();
    public readonly width = input.required<number>();

    public onToggleDetailClick(event: MouseEvent): void {
        event.stopPropagation();
        this.expanded.update(v => !v);
    }
}
