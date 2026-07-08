import { ChangeDetectionStrategy, Component, computed, input, model } from "@angular/core";
import { LucideChevronDown, LucideChevronRight, LucideDynamicIcon, LucideMinus, LucidePlus } from "@lucide/angular";

@Component({
    selector: "mona-grid-toggle",
    imports: [LucideDynamicIcon],
    templateUrl: "./grid-toggle.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridToggleComponent {
    protected readonly collapseIcon = computed(() => {
        const type = this.type();
        return type === "detail" ? LucideMinus : LucideChevronDown;
    });
    protected readonly expandIcon = computed(() => {
        const type = this.type();
        return type === "detail" ? LucidePlus : LucideChevronRight;
    });

    public readonly expanded = model.required<boolean>();
    public readonly type = input.required<"detail" | "group">();
    public readonly width = input.required<number>();

    public onToggleDetailClick(event: MouseEvent): void {
        event.stopPropagation();
        this.expanded.update(v => !v);
    }
}
