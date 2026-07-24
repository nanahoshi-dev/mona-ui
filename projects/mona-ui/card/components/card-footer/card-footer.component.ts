import { afterRenderEffect, Component, DestroyRef, inject, input, TemplateRef, viewChild } from "@angular/core";
import type { ClassInputType } from "@nanahoshi/mona-ui/common";
import { CardService } from "../../services/card.service";

@Component({
    selector: "mona-card-footer",
    imports: [],
    templateUrl: "./card-footer.component.html"
})
export class CardFooterComponent {
    readonly #cardService = inject(CardService);
    private readonly footerTemplate = viewChild.required(TemplateRef);

    /**
     * @description Additional CSS classes merged onto the rendered footer element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<ClassInputType>("", { alias: "class" });

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.#cardService.footerTemplate.set(this.footerTemplate());
                this.#cardService.footerClass.set(this.userClass());
            }
        });
        inject(DestroyRef).onDestroy(() => {
            this.#cardService.footerTemplate.set(null);
            this.#cardService.footerClass.set(null);
        });
    }
}
