import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    TemplateRef
} from "@angular/core";
import { ExpansionPanelActionsTemplateDirective } from "../../directives/expansion-panel-actions-template.directive";
import { ExpansionPanelTitleTemplateDirective } from "../../directives/expansion-panel-title-template.directive";
import { ThemeService } from "../../../../theme/services/theme.service";
import {
    expansionPanelBaseThemeVariants,
    expansionPanelContentThemeVariants,
    expansionPanelHeaderThemeVariants,
    expansionPanelHeaderTitleThemeVariants,
    expansionPanelIconContainerThemeVariants,
    ExpansionPanelVariantInput,
    ExpansionPanelVariantProps
} from "../../styles/expansion-panel.styles";
import { ExpansionPanelIconTemplateDirective } from "../../directives/expansion-panel-icon-template.directive";
import { LucideAngularModule, Minus, Plus } from "lucide-angular";
import { fromEvent } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: "mona-expansion-panel",
    templateUrl: "./expansion-panel.component.html",
    styles: ``,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgTemplateOutlet, LucideAngularModule],
    host: {
        "[class]": "baseClass()",
        "[attr.tabindex]": "0"
    }
})
export class ExpansionPanelComponent implements ExpansionPanelVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    readonly #themeService = inject(ThemeService);
    protected readonly actionsTemplateList = contentChildren(ExpansionPanelActionsTemplateDirective, {
        read: TemplateRef
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.rounded();
        return expansionPanelBaseThemeVariants(theme)({ rounded });
    });
    protected readonly collapseIcon = Minus;
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        const expanded = this.expanded();
        return expansionPanelContentThemeVariants(theme)({ expanded });
    });
    protected readonly expandIcon = Plus;
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        const collapsed = !this.expanded();
        return expansionPanelHeaderThemeVariants(theme)({ collapsed });
    });
    protected readonly headerTitleClass = computed(() => {
        const theme = this.#themeService.theme();
        return expansionPanelHeaderTitleThemeVariants(theme)();
    });
    protected readonly iconContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const hasTemplate = !!this.iconTemplate();
        return expansionPanelIconContainerThemeVariants(theme)({ hasTemplate });
    });
    protected readonly iconTemplate = contentChild(ExpansionPanelIconTemplateDirective, { read: TemplateRef });
    protected readonly titleTemplate = contentChild(ExpansionPanelTitleTemplateDirective, { read: TemplateRef });

    /**
     * @description Sets whether the expansion panel is expanded or collapsed.
     * @default false
     */
    public readonly expanded = model(false);

    /**
     * @description Sets the border radius of the expansion panel.
     * @default "medium"
     */
    public readonly rounded = input<ExpansionPanelVariantProps["rounded"]>("medium");

    /**
     * @description Sets the title of the expansion panel.
     * @default ""
     */
    public readonly title = input("");

    public constructor() {
        afterNextRender({ read: () => this.setKeyboardEvents() });
    }

    private setKeyboardEvents(): void {
        fromEvent<KeyboardEvent>(this.#hostElementRef.nativeElement, "keydown")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.expanded.update(expanded => !expanded);
                }
            });
    }
}
