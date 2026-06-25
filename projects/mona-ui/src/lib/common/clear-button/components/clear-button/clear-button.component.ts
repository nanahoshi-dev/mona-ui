import { ChangeDetectionStrategy, Component, output } from "@angular/core";
import { LucideX } from "@lucide/angular";

@Component({
    selector: "mona-clear-button",
    templateUrl: "./clear-button.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideX],
    host: {
        class: "opacity-50 h-full flex items-center justify-center hover:opacity-90 focus:ring-1 focus:ring-primary/40 focus:outline-none"
    }
})
export class ClearButtonComponent {
    public readonly clear = output<KeyboardEvent | MouseEvent>();

    protected onClearClick(event: Event): void {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.clear.emit(event as MouseEvent | KeyboardEvent);
    }
}
