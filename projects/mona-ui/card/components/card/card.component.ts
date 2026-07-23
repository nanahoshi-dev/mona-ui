import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { classInputToClass } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { CardService } from "../../services/card.service";
import {
    cardBaseThemeVariants,
    cardFooterThemeVariants,
    cardHeaderThemeVariants,
    type CardVariantProps
} from "../../styles/card.styles";

@Component({
    selector: "mona-card",
    imports: [NgTemplateOutlet],
    templateUrl: "./card.component.html",
    host: {
        "[class]": "baseClass()"
    },
    providers: [CardService]
})
export class CardComponent {
    readonly #cardService = inject(CardService);
    protected readonly baseClass = computed(() => {
        const rounded = this.rounded();
        const variantClass = cardBaseThemeVariants({ rounded });
        const userClass = classInputToClass(this.userClass());
        return twMerge(variantClass, userClass);
    });
    protected readonly footerClass = computed(() => {
        const rounded = this.rounded();
        const variantClass = cardFooterThemeVariants({ rounded });
        const userClass = classInputToClass(this.#cardService.footerClass());
        return twMerge(variantClass, userClass);
    });
    protected readonly footerTemplate = this.#cardService.footerTemplate.asReadonly();
    protected readonly headerClass = computed(() => {
        const rounded = this.rounded();
        const variantClass = cardHeaderThemeVariants({ rounded });
        const userClass = classInputToClass(this.#cardService.headerClass());
        return twMerge(variantClass, userClass);
    });
    protected readonly headerTemplate = this.#cardService.headerTemplate.asReadonly();

    public readonly rounded = input<CardVariantProps["rounded"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });
}
