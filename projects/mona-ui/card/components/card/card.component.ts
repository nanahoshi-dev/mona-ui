import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, inject, input } from "@angular/core";
import { classInputToClass } from "@nanahoshi/mona-ui/common";
import { twMerge } from "tailwind-merge";
import { CardContentDirective } from "../../directives/card-content.directive";
import { CardService } from "../../services/card.service";
import {
    cardBaseThemeVariants,
    cardFooterThemeVariants,
    cardHeaderActionsThemeVariants,
    cardHeaderDescriptionThemeVariants,
    cardHeaderThemeVariants,
    cardHeaderTitleThemeVariants,
    type CardVariantInput,
    type CardVariantProps
} from "../../styles/card.styles";

@Component({
    selector: "mona-card",
    imports: [NgTemplateOutlet],
    templateUrl: "./card.component.html",
    host: {
        "[class]": "baseClass()",
        "[attr.aria-labelledby]": "titleId()",
        "[attr.aria-describedby]": "descriptionId()"
    },
    providers: [CardService]
})
export class CardComponent implements CardVariantInput {
    readonly #cardService = inject(CardService);
    protected readonly actionsCellClass = cardHeaderActionsThemeVariants();
    protected readonly actionTemplate = this.#cardService.actionTemplate.asReadonly();
    protected readonly baseClass = computed(() => {
        const rounded = this.rounded();
        const hasHeader = !!this.headerTemplate();
        const hasFooter = !!this.footerTemplate();
        const variantClass = cardBaseThemeVariants({ rounded, hasHeader, hasFooter });
        const userClass = classInputToClass(this.userClass());
        return twMerge(variantClass, userClass);
    });
    protected readonly contentDirective = contentChild(CardContentDirective);
    protected readonly descriptionCellClass = cardHeaderDescriptionThemeVariants();
    protected readonly descriptionId = this.#cardService.descriptionId.asReadonly();
    protected readonly descriptionTemplate = this.#cardService.descriptionTemplate.asReadonly();
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
    protected readonly titleCellClass = cardHeaderTitleThemeVariants();
    protected readonly titleId = this.#cardService.titleId.asReadonly();
    protected readonly titleTemplate = this.#cardService.titleTemplate.asReadonly();

    /**
     * @description Controls the border radius applied to the card and its header/footer regions.
     * @default "medium"
     */
    public readonly rounded = input<CardVariantProps["rounded"]>("medium");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });
}
