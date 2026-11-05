import { afterRenderEffect, Directive, ElementRef, inject, input } from "@angular/core";

/**
 * @internal Sets `aria-pressed` on a toolbar toggle from the editor's state. The button stays `[toggleable]="false"`,
 * so a click never flips it on its own when the command does nothing. It is written after render, because the
 * button's own host binding clears `aria-pressed` on its first render.
 */
@Directive({
    selector: "button[monaEditorPressed]"
})
export class EditorPressedDirective {
    readonly #host = inject<ElementRef<HTMLButtonElement>>(ElementRef);
    public readonly pressed = input.required<boolean>({ alias: "monaEditorPressed" });

    public constructor() {
        afterRenderEffect({
            write: () => this.#host.nativeElement.setAttribute("aria-pressed", this.pressed() ? "true" : "false")
        });
    }
}
