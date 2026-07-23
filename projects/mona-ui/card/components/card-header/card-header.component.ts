import { afterRenderEffect, Component, DestroyRef, inject, input, TemplateRef, viewChild } from "@angular/core";
import type { ClassInputType } from "@nanahoshi/mona-ui/common";
import { CardService } from "../../services/card.service";

@Component({
    selector: "mona-card-header",
    imports: [],
    templateUrl: "./card-header.component.html"
})
export class CardHeaderComponent {
    readonly #cardService = inject(CardService);
    private readonly headerTemplate = viewChild.required(TemplateRef);
    public readonly userClass = input<ClassInputType>("", { alias: "class" });

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.#cardService.headerTemplate.set(this.headerTemplate());
                this.#cardService.headerClass.set(this.userClass());
            }
        });
        inject(DestroyRef).onDestroy(() => {
            this.#cardService.headerTemplate.set(null);
            this.#cardService.headerClass.set(null);
        });
    }
}
