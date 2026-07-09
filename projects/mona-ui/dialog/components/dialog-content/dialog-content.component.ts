import { CdkTrapFocus } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import { afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject } from "@angular/core";
import {
    LucideBadgeInfo,
    LucideBadgeQuestionMark,
    LucideCircleCheckBig,
    LucideDynamicIcon,
    type LucideIconInput,
    LucideOctagonAlert,
    LucideOctagonX,
    LucideX
} from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { AnyPipe } from "@nanahoshi/mona-ui/common";
import { createElementControlId, focusElement } from "@nanahoshi/mona-ui/internal";
import { PopupDataInjectionToken } from "@nanahoshi/mona-ui/popup";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { DialogAction } from "../../models/DialogAction";
import { DialogInjectorData } from "../../models/DialogInjectorData";
import {
    dialogBaseThemeVariants,
    dialogBodyThemeVariants,
    dialogCloseButtonContainerThemeVariants,
    dialogContentContainerThemeVariants,
    dialogContentThemeVariants,
    dialogDescriptionThemeVariants,
    dialogFooterThemeVariants,
    dialogHeaderThemeVariants,
    dialogIconContainerThemeVariants,
    dialogIconThemeVariants,
    dialogTitleContainerThemeVariants,
    dialogTitleThemeVariants,
    DialogVariantProps
} from "../../styles/dialog.styles";

type IconMap = Record<NonNullable<DialogVariantProps["type"]>, { color: string; icon: LucideIconInput }>;

@Component({
    templateUrl: "./dialog-content.component.html",
    imports: [ButtonDirective, NgTemplateOutlet, AnyPipe, LucideX, LucideDynamicIcon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "baseClass()",
        "[attr.aria-describedby]": "describedById()",
        "[attr.aria-labelledby]": "headerId",
        "[attr.role]": "role()"
    },
    hostDirectives: [CdkTrapFocus]
})
export class DialogContentComponent {
    readonly #hostElementRef = inject(ElementRef);
    readonly #iconMap: IconMap = {
        confirm: { color: "var(--color-success)", icon: LucideBadgeQuestionMark },
        error: { color: "var(--color-error)", icon: LucideOctagonX },
        info: { color: "var(--color-info)", icon: LucideBadgeInfo },
        success: { color: "var(--color-success)", icon: LucideCircleCheckBig },
        warning: { color: "var(--color-warning)", icon: LucideOctagonAlert }
    };
    readonly #injectedData = inject<DialogInjectorData>(PopupDataInjectionToken);
    readonly #themeService = inject(ThemeService);
    readonly #trapFocus = inject(CdkTrapFocus);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.dialogData().rounded;
        return dialogBaseThemeVariants(theme)({ rounded });
    });
    protected readonly bodyClass = computed(() => {
        const theme = this.#themeService.theme();
        const hasIcon = this.dialogData().type != null;
        return dialogBodyThemeVariants(theme)({ hasIcon });
    });
    protected readonly closeButtonContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dialogCloseButtonContainerThemeVariants(theme)();
    });
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        return dialogContentThemeVariants(theme)();
    });
    protected readonly contentContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dialogContentContainerThemeVariants(theme)();
    });
    protected readonly describedById = computed(() => {
        const data = this.dialogData();
        return data.descriptionTemplate || data.description ? this.descriptionId : null;
    });
    protected readonly descriptionClass = computed(() => {
        const theme = this.#themeService.theme();
        return dialogDescriptionThemeVariants(theme)();
    });
    protected readonly descriptionId = createElementControlId();
    protected readonly dialogData = computed(() => this.dialogReference.data());
    protected readonly dialogReference = this.#injectedData.dialogReference;
    protected readonly footerClass = computed(() => {
        const theme = this.#themeService.theme();
        const layout = this.dialogData().actionsLayout;
        const rounded = this.dialogData().rounded;
        return dialogFooterThemeVariants(theme)({ layout, rounded });
    });
    protected readonly headerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dialogHeaderThemeVariants(theme)();
    });
    protected readonly headerId = createElementControlId();
    protected readonly icon = computed(() => {
        const { type } = this.dialogData();
        return type ? this.#iconMap[type] : undefined;
    });
    protected readonly iconClass = computed(() => {
        const theme = this.#themeService.theme();
        const type = this.dialogData().type;
        return dialogIconThemeVariants(theme)({ type });
    });
    protected readonly iconContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dialogIconContainerThemeVariants(theme)();
    });
    protected readonly role = computed(() => {
        const type = this.dialogData().type;
        return type === "confirm" || type === "error" || type === "warning" ? "alertdialog" : "dialog";
    });
    protected readonly titleClass = computed(() => {
        const theme = this.#themeService.theme();
        return dialogTitleThemeVariants(theme)();
    });
    protected readonly titleContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return dialogTitleContainerThemeVariants(theme)();
    });

    public constructor() {
        this.#trapFocus.autoCapture = true;
        afterNextRender({
            read: () => {
                this.focusElement();
            }
        });
    }

    public onActionClick(action: DialogAction): void {
        this.dialogReference.dialogResult$.next({
            action,
            viaClose: false
        });
    }

    public onCloseClick(): void {
        this.dialogReference.dialogResult$.next({
            viaClose: true
        });
    }

    private focusElement(): void {
        const element = this.dialogData().focusedElement;
        if (!element) {
            return;
        }
        const dialogElement = this.#hostElementRef.nativeElement;
        focusElement(dialogElement, element);
    }
}
