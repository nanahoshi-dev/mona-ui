import { afterNextRender, Component, computed, type ElementRef, inject, input, viewChild } from "@angular/core";
import { LucideSearch } from "@lucide/angular";
import {
    commandInputFieldThemeVariants,
    commandInputIconThemeVariants,
    commandInputThemeVariants
} from "../../styles/command.styles";
import { CommandComponent } from "../command/command.component";

/**
 * The search field of a `mona-command`. Focus stays here while the arrow keys move through the list, so typing always
 * continues the search.
 */
@Component({
    selector: "mona-command-input",
    imports: [LucideSearch],
    templateUrl: "./command-input.component.html",
    host: {
        "[class]": "hostClass()"
    }
})
export class CommandInputComponent {
    protected readonly field = viewChild.required<ElementRef<HTMLInputElement>>("field");
    protected readonly fieldClass = computed(() => commandInputFieldThemeVariants());
    protected readonly hostClass = computed(() => commandInputThemeVariants());
    protected readonly iconClass = computed(() => commandInputIconThemeVariants());
    protected readonly root = inject(CommandComponent);

    /** @description The accessible name of the field. */
    public readonly ariaLabel = input<string>();
    /** @description The text shown while the field is empty. */
    public readonly placeholder = input<string>();

    public constructor() {
        afterNextRender({ read: () => this.root.registerInput(this.field().nativeElement) });
    }

    protected onInput(event: Event): void {
        this.root.query.set((event.target as HTMLInputElement).value);
    }

    protected onKeydown(event: KeyboardEvent): void {
        // While an input method composes text, these keys belong to it. Enter there confirms the composition.
        if (event.isComposing) {
            return;
        }
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                this.root.move(1);
                break;
            case "ArrowUp":
                event.preventDefault();
                this.root.move(-1);
                break;
            case "Enter":
                event.preventDefault();
                this.root.selectActive(event);
                break;
        }
    }
}
