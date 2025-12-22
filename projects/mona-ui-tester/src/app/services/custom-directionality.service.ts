import { Direction, Directionality } from "@angular/cdk/bidi";
import { DestroyRef, DOCUMENT, EventEmitter, inject, Injectable, NgZone } from "@angular/core";

@Injectable()
export class CustomDirectionalityService extends Directionality {
    readonly #document = inject(DOCUMENT);
    readonly #change = new EventEmitter<Direction>();
    readonly #zone = inject(NgZone);
    #value = (this.#document.documentElement.getAttribute("dir") as Direction) || "ltr";
    private readonly mutationObserver = new MutationObserver(() => {
        const next = (this.#document.documentElement.getAttribute("dir") as Direction) || "ltr";
        if (this.#value !== next) {
            this.#value = next;
            this.#zone.run(() => this.#change.next(this.#value));
        }
    });
    public override change = this.#change;

    public constructor() {
        super();
        this.mutationObserver.observe(this.#document.documentElement, { attributes: true, attributeFilter: ["dir"] });
        inject(DestroyRef).onDestroy(() => {
            this.mutationObserver.disconnect();
            this.#change.complete();
        });
    }

    public override get value(): Direction {
        return this.#value;
    }
}
