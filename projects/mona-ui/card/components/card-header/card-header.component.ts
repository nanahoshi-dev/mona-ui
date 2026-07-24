import {
    afterRenderEffect,
    Component,
    contentChild,
    DestroyRef,
    inject,
    input,
    TemplateRef,
    viewChild
} from "@angular/core";
import type { ClassInputType } from "@nanahoshi/mona-ui/common";
import { CardActionDirective } from "../../directives/card-action.directive";
import { CardDescriptionDirective } from "../../directives/card-description.directive";
import { CardTitleDirective } from "../../directives/card-title.directive";
import { CardService } from "../../services/card.service";

@Component({
    selector: "mona-card-header",
    templateUrl: "./card-header.component.html"
})
export class CardHeaderComponent {
    readonly #cardService = inject(CardService);
    private readonly actionDirective = contentChild(CardActionDirective);
    private readonly descriptionDirective = contentChild(CardDescriptionDirective);
    private readonly headerTemplate = viewChild.required(TemplateRef);
    private readonly titleDirective = contentChild(CardTitleDirective);
    public readonly userClass = input<ClassInputType>("", { alias: "class" });

    public constructor() {
        afterRenderEffect({
            read: () => {
                this.#cardService.actionTemplate.set(this.actionDirective()?.templateRef ?? null);
                this.#cardService.descriptionTemplate.set(this.descriptionDirective()?.templateRef ?? null);
                this.#cardService.headerTemplate.set(this.headerTemplate());
                this.#cardService.headerClass.set(this.userClass());
                this.#cardService.titleTemplate.set(this.titleDirective()?.templateRef ?? null);
            }
        });
        inject(DestroyRef).onDestroy(() => {
            this.#cardService.actionTemplate.set(null);
            this.#cardService.descriptionTemplate.set(null);
            this.#cardService.headerTemplate.set(null);
            this.#cardService.headerClass.set(null);
            this.#cardService.titleTemplate.set(null);
        });
    }
}
