import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    ElementRef,
    forwardRef,
    inject,
    input,
    isDevMode,
    model,
    TemplateRef,
    viewChild
} from "@angular/core";
import { LucideMinus, LucidePlus } from "@lucide/angular";
import { COLLAPSIBLE_CONFIG, type CollapsibleConfig, CollapsibleTriggerDirective } from "@nanahoshi/mona-ui/collapsible";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { ExpansionPanelActionsTemplateDirective } from "../../directives/expansion-panel-actions-template.directive";
import { ExpansionPanelIconTemplateDirective } from "../../directives/expansion-panel-icon-template.directive";
import { ExpansionPanelTitleTemplateDirective } from "../../directives/expansion-panel-title-template.directive";
import { EXPANSION_PANEL_ACCORDION } from "../../models/accordion.token";
import type { ExpansionPanelVariantInput, ExpansionPanelVariantProps } from "../../styles/expansion-panel.styles";
import {
    expansionPanelActionsThemeVariants,
    expansionPanelBaseThemeVariants,
    expansionPanelContentThemeVariants,
    expansionPanelHeaderThemeVariants,
    expansionPanelHeaderTitleThemeVariants,
    expansionPanelHeadingThemeVariants,
    expansionPanelIconContainerThemeVariants,
    expansionPanelTriggerThemeVariants
} from "../../styles/expansion-panel.styles";

/** A level from 1 to 6, `null` for no heading at all, and the default for anything else. */
function toHeadingLevel(value: unknown): number | null {
    if (value === null) {
        return null;
    }
    const level = Number(value);
    return Number.isInteger(level) && level >= 1 && level <= 6 ? level : 3;
}

/** `Node.DOCUMENT_POSITION_FOLLOWING`, written out because `Node` isn't a global on the server. */
const DOCUMENT_POSITION_FOLLOWING = 4;

@Component({
    selector: "mona-expansion-panel",
    templateUrl: "./expansion-panel.component.html",
    imports: [NgTemplateOutlet, LucideMinus, LucidePlus, CollapsibleTriggerDirective],
    host: {
        "[class]": "baseClass()",
        // A plain `title` attribute would stay on the host as a tooltip over the whole panel.
        "[attr.title]": "null"
    },
    providers: [{ provide: COLLAPSIBLE_CONFIG, useExisting: forwardRef(() => ExpansionPanelComponent) }]
})
export class ExpansionPanelComponent implements ExpansionPanelVariantInput, CollapsibleConfig {
    readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    protected readonly actionsClass = computed(() => {
        return expansionPanelActionsThemeVariants();
    });
    protected readonly actionsTemplateList = contentChildren(ExpansionPanelActionsTemplateDirective, {
        read: TemplateRef
    });
    protected readonly baseClass = computed(() => {
        const rounded = this.rounded();
        const variantClass = expansionPanelBaseThemeVariants({ rounded });
        return twMerge(variantClass, this.userClass());
    });
    protected readonly contentClass = computed(() => {
        const expanded = this.expanded();
        return expansionPanelContentThemeVariants({ expanded });
    });
    protected readonly headerClass = computed(() => {
        return expansionPanelHeaderThemeVariants({ collapsed: !this.expanded() });
    });
    protected readonly headerTitleClass = computed(() => {
        return expansionPanelHeaderTitleThemeVariants();
    });
    protected readonly headingClass = computed(() => {
        return expansionPanelHeadingThemeVariants();
    });
    protected readonly iconContainerClass = computed(() => {
        const hasTemplate = !!this.iconTemplate();
        return expansionPanelIconContainerThemeVariants({ hasTemplate });
    });
    protected readonly iconTemplate = contentChild(ExpansionPanelIconTemplateDirective, { read: TemplateRef });
    protected readonly titleTemplate = contentChild(ExpansionPanelTitleTemplateDirective, { read: TemplateRef });
    protected readonly triggerClass = computed(() => {
        return expansionPanelTriggerThemeVariants({ disabled: this.disabled() });
    });
    protected readonly triggerElement = viewChild.required<ElementRef<HTMLButtonElement>>("trigger");
    protected readonly triggerId = createElementControlId();

    /**
     * @description Always enabled. Satisfies the `CollapsibleConfig` contract for `monaCollapsibleTrigger`;
     * this component doesn't use `monaCollapsibleContent`, so no animation ever consults it.
     */
    public readonly animate = computed(() => true);

    public readonly contentId = createElementControlId();

    /**
     * @description Disables the header: toggling by click or key, and the actions in it.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Sets whether the expansion panel is expanded or collapsed.
     * @default false
     */
    public readonly expanded = model(false);

    /**
     * @description The level of the heading around the header's button, from 1 to 6. Set it to fit the page's outline, or
     * to `null` for no heading.
     * @default 3
     */
    public readonly headingLevel = input<number | null, unknown>(3, { transform: toHeadingLevel });

    /**
     * @description Sets the border radius of the expansion panel.
     * @default "medium"
     */
    public readonly rounded = input<ExpansionPanelVariantProps["rounded"]>("medium");

    /**
     * @description Sets the title of the expansion panel, which also names its button and region.
     * @default ""
     */
    public readonly title = input("");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        const accordion = inject(EXPANSION_PANEL_ACCORDION, { optional: true });
        if (accordion) {
            inject(DestroyRef).onDestroy(accordion.register(this));
        }
        if (isDevMode()) {
            afterNextRender({
                read: () => {
                    const trigger = this.triggerElement().nativeElement;
                    if (!trigger.textContent?.trim() && !trigger.querySelector("[aria-label], img[alt]")) {
                        console.warn("mona-expansion-panel: a panel needs a title, or its button has no name.");
                    }
                }
            });
        }
    }

    /** Collapses the panel, even when `disabled`. */
    public collapse(): void {
        this.expanded.set(false);
    }

    /**
     * @internal
     */
    public compareDocumentOrder(other: ExpansionPanelComponent): number {
        return this.#host.compareDocumentPosition(other.#host) & DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    }

    /** Expands the panel, even when `disabled`. */
    public expand(): void {
        this.expanded.set(true);
    }

    /**
     * Moves focus to the panel's header button.
     */
    public focus(): void {
        this.triggerElement().nativeElement.focus();
    }

    /**
     * @internal
     */
    public ownsTrigger(element: EventTarget | null): boolean {
        return this.triggerElement().nativeElement === element;
    }

    /** Toggles the panel, unless it's `disabled`. */
    public toggle(): void {
        if (this.disabled()) {
            return;
        }
        this.expanded.update(expanded => !expanded);
    }
}
