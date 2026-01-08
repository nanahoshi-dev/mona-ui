import { ChangeDetectionStrategy, Component, output } from "@angular/core";
import { LucideAngularModule, X } from "lucide-angular";

@Component({
    selector: "mona-clear-button",
    imports: [LucideAngularModule],
    templateUrl: "./clear-button.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: "opacity-50 h-full flex items-center justify-center hover:opacity-90"
    }
})
export class ClearButtonComponent {
    protected readonly clearIcon = X;

    public readonly clear = output<KeyboardEvent | MouseEvent>();

    protected onClearClick(event: Event): void {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.clear.emit(event as MouseEvent | KeyboardEvent);
    }
}
