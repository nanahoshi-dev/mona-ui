import { CdkTrapFocus } from "@angular/cdk/a11y";
import type { OverlaySizeConfig } from "@angular/cdk/overlay";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    type ComponentRef,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    isDevMode,
    signal,
    TemplateRef,
    type Type,
    untracked,
    viewChild,
    ViewContainerRef
} from "@angular/core";
import {
    LucideAppWindow,
    LucideDynamicIcon,
    LucideMaximize,
    LucideMinimize,
    LucideMinus,
    LucideX
} from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { mergeMessages, type MonaWindowMessages, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId, focusElement } from "@nanahoshi/mona-ui/internal";
import { PopupCloseEvent, PopupCloseSource, PopupDataInjectionToken } from "@nanahoshi/mona-ui/popup";
import { WindowDragHandlerDirective } from "../../directives/window-drag-handler.directive";
import { WindowResizeHandlerDirective } from "../../directives/window-resize-handler.directive";
import { WINDOW_DEFAULT_MESSAGES } from "../../i18n/window.default-messages";
import type { WindowInjectorData } from "../../models/WindowInjectorData";
import type { WindowPlacement } from "../../models/WindowReference";
import type { WindowResizeHandlerDirection } from "../../models/WindowResizeHandlerDirection";
import { ResizePositionPipe } from "../../pipes/resize-position.pipe";
import {
    windowBaseThemeVariants,
    windowContentContainerThemeVariants,
    windowContentThemeVariants,
    WindowContentVariantInput,
    windowTitleBarActionThemeVariants,
    windowTitleBarThemeVariants,
    windowTitleContainerThemeVariants,
    windowTitleThemeVariants
} from "../../styles/window.styles";

/** Targets inside the title bar whose double-click is their own. */
const INTERACTIVE = "a[href], button, input, select, textarea, [contenteditable]:not([contenteditable='false'])";

@Component({
    selector: "mona-window-content",
    templateUrl: "./window-content.component.html",
    imports: [
        WindowDragHandlerDirective,
        NgTemplateOutlet,
        ButtonDirective,
        WindowResizeHandlerDirective,
        ResizePositionPipe,
        LucideDynamicIcon,
        LucideX
    ],
    host: {
        "[class]": "baseClass()",
        "[attr.aria-label]": "hasTitle ? null : windowData.ariaLabel || null",
        "[attr.aria-labelledby]": "hasTitle ? headerId : null",
        "[attr.aria-modal]": "windowData.modal ? 'true' : 'false'",
        "(focusin)": "onFocusIn($event)",
        role: "dialog"
    },
    hostDirectives: [CdkTrapFocus]
})
export class WindowContentComponent implements WindowContentVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #localeMessages = this.#i18n.componentMessages("window", WINDOW_DEFAULT_MESSAGES);
    readonly #trapFocus = inject(CdkTrapFocus);
    #beforeMaximize: { placement: WindowPlacement; size: OverlaySizeConfig } | null = null;
    #beforeMinimize: OverlaySizeConfig | null = null;
    #componentRef: ComponentRef<unknown> | null = null;
    private readonly componentHost = viewChild("componentHost", { read: ViewContainerRef });
    protected readonly baseClass = computed(() => {
        const rounded = this.windowData.rounded;
        return windowBaseThemeVariants({ rounded });
    });
    protected readonly contentClass = computed(() => {
        return windowContentThemeVariants();
    });
    protected readonly contentComponent: Type<unknown> | null;
    protected readonly contentContainerClass = computed(() => {
        const rounded = this.windowData.rounded;
        return windowContentContainerThemeVariants({ rounded });
    });
    protected readonly contentTemplate: TemplateRef<unknown> | null;
    protected readonly hasTitle: boolean;
    protected readonly headerId = createElementControlId();
    protected readonly maximizeIcon = computed(() => {
        return this.maximized() ? LucideMinimize : LucideMaximize;
    });
    protected readonly maximized = signal(false);
    protected readonly messages = computed<MonaWindowMessages>(() => {
        return mergeMessages(this.#localeMessages(), this.windowData.messages);
    });
    protected readonly minimizeIcon = computed(() => {
        return this.minimized() ? LucideAppWindow : LucideMinus;
    });
    protected readonly minimized = signal(false);
    protected readonly resizeDirections: readonly WindowResizeHandlerDirection[] = [
        "north",
        "south",
        "east",
        "west",
        "northeast",
        "northwest",
        "southeast",
        "southwest"
    ];
    protected readonly titleBarActionClass = computed(() => {
        return windowTitleBarActionThemeVariants();
    });
    protected readonly titleBarClass = computed(() => {
        const look = this.windowData.look;
        const rounded = this.windowData.rounded;
        return windowTitleBarThemeVariants({ look, rounded });
    });
    /** The title bar's name, which also says which keys move or resize the window; none when it does neither. */
    protected readonly titleBarLabel = computed(() => {
        const { draggable, resizable } = this.windowData;
        const messages = this.messages();
        if (draggable && resizable) {
            return messages.moveOrResizeWindow;
        }
        if (draggable) {
            return messages.moveWindow;
        }
        return resizable ? messages.resizeWindow : null;
    });
    protected readonly titleClass = computed(() => {
        const look = this.windowData.look;
        return windowTitleThemeVariants({ look });
    });
    protected readonly titleContainerClass = computed(() => {
        return windowTitleContainerThemeVariants();
    });
    protected readonly windowData = inject<WindowInjectorData>(PopupDataInjectionToken);
    protected readonly windowRef = this.windowData.windowReference.windowRef;

    public constructor() {
        const content = this.windowData.content;
        this.contentTemplate = content instanceof TemplateRef ? content : null;
        this.contentComponent = content && !(content instanceof TemplateRef) ? (content as Type<unknown>) : null;
        this.hasTitle = !!this.windowData.title || !!this.windowData.titleTemplate;
        this.#trapFocus.autoCapture = true;
        this.#trapFocus.enabled = this.windowData.modal ?? false;
        effect(() => {
            const host = this.componentHost();
            untracked(() => this.#renderComponent(host));
        });
        // Capture phase: the window is raised before the title bar captures the pointer for a drag, since moving
        // the overlay in the DOM would release that capture.
        const raise = () => this.windowData.windowReference.bringToFront();
        const host = this.#hostElementRef.nativeElement;
        host.addEventListener("pointerdown", raise, { capture: true });
        this.#destroyRef.onDestroy(() => {
            host.removeEventListener("pointerdown", raise, { capture: true });
            this.#componentRef?.destroy();
            this.windowData.windowReference.setComponentRef(undefined);
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

    public onCloseClick(event: MouseEvent): void {
        this.closeWindow(event);
    }

    /** Focus arriving from outside raises the window, as a click does. */
    protected onFocusIn(event: FocusEvent): void {
        const from = event.relatedTarget;
        if (from instanceof Node && this.#hostElementRef.nativeElement.contains(from)) {
            return;
        }
        this.windowData.windowReference.bringToFront();
    }

    protected onMaximizeClick(): void {
        if (this.minimized()) {
            this.#restoreFromMinimize();
        }
        if (this.maximized()) {
            this.#restoreFromMaximize();
        } else {
            this.#maximize();
        }
    }

    protected onMinimizeClick(): void {
        if (this.minimized()) {
            this.#restoreFromMinimize();
        } else {
            this.#minimize();
        }
    }

    protected onTitleBarDoubleClick(event: MouseEvent): void {
        if (!this.windowData.maximizable) {
            return;
        }
        const target = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
        if (target) {
            return;
        }
        this.onMaximizeClick();
    }

    #maximize(): void {
        const reference = this.windowData.windowReference;
        const { height, width } = reference.size;
        this.#beforeMaximize = { placement: reference.placement, size: { height, width } };
        this.maximized.set(true);
        // CSS lengths follow the viewport as it resizes, within the window's maxWidth and maxHeight.
        reference.setSize({ height: "100dvh", width: "100dvw" });
        reference.center();
    }

    #minimize(): void {
        const reference = this.windowData.windowReference;
        const { height, minHeight, width } = reference.size;
        this.#beforeMinimize = { height, minHeight, width };
        this.minimized.set(true);
        // Keep the width it has, so a window sized by its content doesn't shrink to its title.
        reference.setSize({ height: "fit-content", minHeight: 0, width: width ?? reference.width });
    }

    #renderComponent(host: ViewContainerRef | undefined): void {
        const type = this.contentComponent;
        if (!host || !type || this.#componentRef) {
            return;
        }
        host.clear();
        this.#componentRef = host.createComponent(type, { injector: this.#injector });
        this.windowData.windowReference.setComponentRef(this.#componentRef);
    }

    #restoreFromMaximize(): void {
        const saved = this.#beforeMaximize;
        this.#beforeMaximize = null;
        this.maximized.set(false);
        if (saved) {
            this.windowData.windowReference.setSize(saved.size);
            this.windowData.windowReference.place(saved.placement);
        }
    }

    #restoreFromMinimize(): void {
        const saved = this.#beforeMinimize;
        this.#beforeMinimize = null;
        this.minimized.set(false);
        if (saved) {
            this.windowData.windowReference.setSize(saved);
        }
    }

    #warnIfUnnamed(): void {
        if (this.hasTitle || this.windowData.ariaLabel) {
            return;
        }
        console.warn(
            "[Mona Window] A window needs an accessible name. Set title, a title template or ariaLabel.",
            this.#hostElementRef.nativeElement
        );
    }

    private closeWindow(event: Event): void {
        // preventClose and close$ get their say inside close(); this button doesn't ask a second time.
        const closeEvent = new PopupCloseEvent({ event, via: PopupCloseSource.CloseButton, originalEvent: event });
        this.windowData.windowReference.close(closeEvent);
    }

    private focusElement(): void {
        const element = this.windowData.focusedElement;
        if (!element) {
            return;
        }
        const windowElement = this.#hostElementRef.nativeElement;
        // The focus trap moves focus to its first tabbable element after this runs; marking the target makes it
        // land here instead.
        focusElement(windowElement, element)?.setAttribute("cdkFocusInitial", "");
    }
}
