import { CdkTrapFocus } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    type ComponentRef,
    computed,
    effect,
    ElementRef,
    inject,
    Injector,
    isDevMode,
    TemplateRef,
    type Type,
    untracked,
    viewChild,
    ViewContainerRef
} from "@angular/core";
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
import { mergeMessages, type MonaDialogMessages, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId, focusElement } from "@nanahoshi/mona-ui/internal";
import { PopupDataInjectionToken } from "@nanahoshi/mona-ui/popup";
import { DIALOG_DEFAULT_MESSAGES } from "../../i18n/dialog.default-messages";
import type { DialogAction } from "../../models/DialogAction";
import type { DialogInjectorData } from "../../models/DialogInjectorData";
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

/** Targets that handle Enter themselves, so it doesn't trigger the dialog's default action. */
const HANDLES_ENTER = [
    "a[href]",
    "button",
    "form",
    "select",
    "textarea",
    "[contenteditable]:not([contenteditable='false'])",
    "[role='button']",
    "[role='checkbox']",
    "[role='combobox']",
    "[role='link']",
    "[role='listbox']",
    "[role='menu']",
    "[role='menuitem']",
    "[role='option']",
    "[role='radio']",
    "[role='switch']",
    "[role='tab']",
    "input:is([type='button'], [type='checkbox'], [type='color'], [type='file'], [type='image'], [type='radio'], [type='reset'], [type='submit'])"
].join(", ");

@Component({
    templateUrl: "./dialog-content.component.html",
    imports: [ButtonDirective, NgTemplateOutlet, AnyPipe, LucideX, LucideDynamicIcon],
    host: {
        "[class]": "baseClass()",
        "[attr.aria-describedby]": "describedById()",
        "[attr.aria-label]": "hasTitle() ? null : dialogData().ariaLabel || null",
        "[attr.aria-labelledby]": "hasTitle() ? headerId : null",
        "[attr.aria-modal]": "dialogData().modal ? 'true' : null",
        "[attr.role]": "role()",
        "(keydown)": "onKeydown($event)"
    },
    hostDirectives: [CdkTrapFocus]
})
export class DialogContentComponent {
    readonly #hostElementRef = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #iconMap: IconMap = {
        confirm: { color: "var(--color-success)", icon: LucideBadgeQuestionMark },
        error: { color: "var(--color-error)", icon: LucideOctagonX },
        info: { color: "var(--color-info)", icon: LucideBadgeInfo },
        success: { color: "var(--color-success)", icon: LucideCircleCheckBig },
        warning: { color: "var(--color-warning)", icon: LucideOctagonAlert }
    };
    readonly #injectedData = inject<DialogInjectorData>(PopupDataInjectionToken);
    readonly #injector = inject(Injector);
    readonly #localeMessages = this.#i18n.componentMessages("dialog", DIALOG_DEFAULT_MESSAGES);
    readonly #trapFocus = inject(CdkTrapFocus);
    #componentRef: ComponentRef<unknown> | null = null;
    private readonly componentHost = viewChild("componentHost", { read: ViewContainerRef });
    protected readonly actions = computed(() => {
        const data = this.dialogData();
        if (data.actions != null) {
            return data.actions;
        }
        return this.getDefaultActions(data.type);
    });
    protected readonly baseClass = computed(() => {
        const rounded = this.dialogData().rounded;
        return dialogBaseThemeVariants({ rounded });
    });
    protected readonly bodyClass = computed(() => {
        const hasIcon = this.dialogData().type != null;
        return dialogBodyThemeVariants({ hasIcon });
    });
    protected readonly closeButtonContainerClass = computed(() => {
        return dialogCloseButtonContainerThemeVariants();
    });
    protected readonly contentClass = computed(() => {
        return dialogContentThemeVariants();
    });
    protected readonly contentComponent = computed(() => {
        const content = this.dialogData().content;
        return content && !(content instanceof TemplateRef) ? (content as Type<unknown>) : null;
    });
    protected readonly contentContainerClass = computed(() => {
        return dialogContentContainerThemeVariants();
    });
    protected readonly contentTemplate = computed(() => {
        const content = this.dialogData().content;
        return content instanceof TemplateRef ? content : null;
    });
    protected readonly describedById = computed(() => {
        const data = this.dialogData();
        return data.descriptionTemplate || data.description ? this.descriptionId : null;
    });
    protected readonly descriptionClass = computed(() => {
        return dialogDescriptionThemeVariants();
    });
    protected readonly descriptionId = createElementControlId();
    protected readonly dialogData = computed(() => this.dialogReference.data());
    protected readonly dialogRef = this.#injectedData.dialogReference.dialogRef;
    protected readonly dialogReference = this.#injectedData.dialogReference;
    protected readonly footerClass = computed(() => {
        const layout = this.dialogData().actionsLayout;
        const rounded = this.dialogData().rounded;
        return dialogFooterThemeVariants({ layout, rounded });
    });
    protected readonly hasTitle = computed(() => {
        const data = this.dialogData();
        return !!data.titleTemplate || !!data.title;
    });
    protected readonly headerClass = computed(() => {
        return dialogHeaderThemeVariants();
    });
    protected readonly headerId = createElementControlId();
    protected readonly icon = computed(() => {
        const { type } = this.dialogData();
        return type ? this.#iconMap[type] : undefined;
    });
    protected readonly iconClass = computed(() => {
        const type = this.dialogData().type;
        return dialogIconThemeVariants({ type });
    });
    protected readonly iconContainerClass = computed(() => {
        return dialogIconContainerThemeVariants();
    });
    protected readonly messages = computed<MonaDialogMessages>(() => {
        return mergeMessages(this.#localeMessages(), this.dialogData().messages);
    });
    protected readonly role = computed(() => {
        const type = this.dialogData().type;
        return type === "confirm" || type === "error" || type === "warning" ? "alertdialog" : "dialog";
    });
    protected readonly titleClass = computed(() => {
        return dialogTitleThemeVariants();
    });
    protected readonly titleContainerClass = computed(() => {
        return dialogTitleContainerThemeVariants();
    });

    public constructor() {
        this.#trapFocus.autoCapture = true;
        // A non-modal dialog leaves the page usable, so Tab can leave it too.
        this.#trapFocus.enabled = this.dialogData().modal ?? true;
        effect(() => {
            const host = this.componentHost();
            const type = this.contentComponent();
            untracked(() => this.#renderComponent(host, type));
        });
        afterNextRender({
            write: () => {
                this.focusElement();
                if (isDevMode()) {
                    this.#warnIfUnnamed();
                }
            }
        });
    }

    public onActionClick(action: DialogAction): void {
        this.dialogReference.requestAction(action);
    }

    public onCloseClick(): void {
        this.dialogReference.requestClose();
    }

    /** Enter outside a control that handles it triggers the default action, as in a form. */
    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== "Enter" || event.defaultPrevented || event.isComposing) {
            return;
        }
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || this.dialogData().footerTemplate) {
            return;
        }
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest(HANDLES_ENTER)) {
            return;
        }
        const action = Array.from(this.actions()).find(candidate => candidate.default);
        if (action) {
            event.preventDefault();
            this.onActionClick(action);
        }
    }

    #renderComponent(host: ViewContainerRef | undefined, type: Type<unknown> | null): void {
        if (this.#componentRef && (!host || this.#componentRef.componentType !== type)) {
            this.#componentRef.destroy();
            this.#componentRef = null;
            this.dialogReference.setComponentRef(undefined);
        }
        if (host && type && !this.#componentRef) {
            host.clear();
            this.#componentRef = host.createComponent(type, { injector: this.#injector });
            this.dialogReference.setComponentRef(this.#componentRef);
        }
    }

    #warnIfUnnamed(): void {
        if (this.hasTitle() || this.dialogData().ariaLabel) {
            return;
        }
        console.warn(
            "[Mona Dialog] A dialog needs an accessible name. Set title, titleTemplate or ariaLabel.",
            this.#hostElementRef.nativeElement
        );
    }

    private focusElement(): void {
        const element = this.dialogData().focusedElement;
        if (!element) {
            return;
        }
        const dialogElement = this.#hostElementRef.nativeElement;
        // The focus trap moves focus to its first tabbable element after this runs; marking the target makes it
        // land here instead.
        focusElement(dialogElement, element)?.setAttribute("cdkFocusInitial", "");
    }

    private getDefaultActions(type: DialogVariantProps["type"] | undefined): DialogAction[] {
        const messages = this.messages();
        const ok: DialogAction = { data: "ok", default: true, look: "primary", text: messages.ok };
        if (type === "confirm") {
            return [ok, { data: "cancel", look: "default", text: messages.cancel }];
        }
        return [ok];
    }
}
