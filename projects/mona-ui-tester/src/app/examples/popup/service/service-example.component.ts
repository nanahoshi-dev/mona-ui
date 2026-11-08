import { Component, inject, signal, TemplateRef, viewChild } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { PopupRef } from "@nanahoshi/mona-ui/popup";
import { PopupService } from "@nanahoshi/mona-ui/popup";

@Component({
    selector: "app-popup-service-example",
    imports: [ButtonDirective],
    templateUrl: "./service-example.component.html"
})
export class PopupServiceExampleComponent {
    readonly #popupService = inject(PopupService);
    #popupRef: PopupRef | null = null;
    protected readonly answer = signal("none");
    protected readonly question = viewChild.required<TemplateRef<void>>("question");

    protected ask(anchor: HTMLElement): void {
        if (this.#popupRef) {
            return;
        }
        const popupRef = this.#popupService.create({ anchor, content: this.question() });
        popupRef.opened.subscribe(() => popupRef.overlayRef.overlayElement.querySelector("button")?.focus());
        popupRef.closed.subscribe(event => {
            this.answer.set(typeof event.result === "string" ? event.result : "no answer");
            this.#popupRef = null;
        });
        this.#popupRef = popupRef;
    }

    protected reply(value: string): void {
        this.#popupRef?.close(value);
    }
}
