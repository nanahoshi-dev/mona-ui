import { CdkTrapFocus } from "@angular/cdk/a11y";
import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ApplicationRef,
    Component,
    ComponentRef,
    computed,
    createComponent,
    DOCUMENT,
    ElementRef,
    inject,
    Injector,
    signal,
    TemplateRef,
    viewChild,
    ViewContainerRef
} from "@angular/core";
import { LucideDynamicIcon, LucideMaximize, LucideMinimize, LucideMinus, LucideX } from "@lucide/angular";
import { ButtonDirective } from "@mirei/mona-ui/button";
import { createElementControlId, focusElement } from "@mirei/mona-ui/common";
import { PopupCloseEvent, PopupCloseSource, PopupDataInjectionToken } from "@mirei/mona-ui/popup";
import { ThemeService } from "@mirei/mona-ui/theme";
import { WindowDragHandlerDirective } from "../../directives/window-drag-handler.directive";
import { WindowResizeHandlerDirective } from "../../directives/window-resize-handler.directive";
import { WindowInjectorData } from "../../models/WindowInjectorData";
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

@Component({
    selector: "mona-window-content",
    templateUrl: "./window-content.component.html",
    imports: [
        WindowDragHandlerDirective,
        NgTemplateOutlet,
        ButtonDirective,
        WindowResizeHandlerDirective,
        ResizePositionPipe,
        LucideMinus,
        LucideDynamicIcon,
        LucideX
    ],
    host: {
        "[class]": "baseClass()",
        "[attr.aria-labelledby]": "headerId",
        "[attr.aria-modal]": "windowData.modal ?? false",
        role: "dialog"
    },
    hostDirectives: [CdkTrapFocus]
})
export class WindowContentComponent implements WindowContentVariantInput {
    readonly #appRef = inject(ApplicationRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #injector = inject(Injector);

    readonly #sizeBeforeMaximize = signal({ width: 0, height: 0, top: 0, left: 0 });
    readonly #sizeBeforeMinimize = signal(0);
    readonly #themeService = inject(ThemeService);
    readonly #trapFocus = inject(CdkTrapFocus);
    readonly #viewContainerRef = inject(ViewContainerRef);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.windowData.rounded;
        return windowBaseThemeVariants(theme)({ rounded });
    });
    protected readonly componentAnchor = viewChild.required("componentAnchor", {
        read: ViewContainerRef
    });
    protected readonly componentRef?: ComponentRef<unknown>;
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        return windowContentThemeVariants(theme)();
    });
    protected readonly contentContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.windowData.rounded;
        return windowContentContainerThemeVariants(theme)({ rounded });
    });
    protected readonly contentTemplate = computed(() => {
        const content = this.windowData.content;
        return content instanceof TemplateRef ? content : null;
    });
    protected readonly contentType = signal<"template" | "component">("template");
    protected readonly headerId = createElementControlId();
    protected readonly maximizeIcon = computed(() => {
        return this.maximized() && !this.minimized() ? LucideMinimize : LucideMaximize;
    });
    protected readonly maximized = signal(false);
    protected readonly minimized = signal(false);
    protected readonly titleBarActionClass = computed(() => {
        const theme = this.#themeService.theme();
        return windowTitleBarActionThemeVariants(theme)();
    });
    protected readonly titleBarClass = computed(() => {
        const theme = this.#themeService.theme();
        const look = this.windowData.look;
        const rounded = this.windowData.rounded;
        return windowTitleBarThemeVariants(theme)({ look, rounded });
    });
    protected readonly titleClass = computed(() => {
        const theme = this.#themeService.theme();
        const look = this.windowData.look;
        return windowTitleThemeVariants(theme)({ look });
    });
    protected readonly titleContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        return windowTitleContainerThemeVariants(theme)();
    });
    protected readonly windowData = inject<WindowInjectorData>(PopupDataInjectionToken);

    public constructor() {
        this.#trapFocus.autoCapture = true;
        this.#trapFocus.enabled = this.windowData.modal ?? false;
        if (this.windowData.content instanceof TemplateRef) {
            this.contentType.set("template");
        } else if (this.windowData.content) {
            this.contentType.set("component");
            this.componentRef = createComponent(this.windowData.content, {
                environmentInjector: this.#appRef.injector,
                elementInjector: this.#injector
            });
        }
        afterNextRender({
            read: () => {
                this.#createView();
                this.focusElement();
            }
        });
    }

    public onCloseClick(event: MouseEvent): void {
        this.closeWindow(event);
    }

    protected onMaximizeClick(): void {
        const innerWidth = this.#document.defaultView?.innerWidth;
        const innerHeight = this.#document.defaultView?.innerHeight;
        if (this.minimized()) {
            this.minimized.set(false);
            this.windowData.windowReference.resize({
                width: this.maximized() ? innerWidth : this.#sizeBeforeMaximize().width,
                height: this.maximized() ? innerHeight : this.#sizeBeforeMaximize().height,
                center: false
            });
            return;
        }
        if (this.maximized()) {
            this.maximized.set(false);
            this.windowData.windowReference.resize({
                width: this.#sizeBeforeMaximize().width,
                height: this.#sizeBeforeMaximize().height
            });
            this.windowData.windowReference.move({
                top: this.#sizeBeforeMaximize().top,
                left: this.#sizeBeforeMaximize().left
            });
        } else {
            const element = this.windowData.windowReference.element;
            this.#sizeBeforeMaximize.set({
                width: this.windowData.windowReference.width,
                height: this.windowData.windowReference.height,
                top: element.offsetTop,
                left: element.offsetLeft
            });
            this.maximized.set(true);
            this.windowData.windowReference.resize({
                width: innerWidth,
                height: innerHeight
            });
            this.windowData.windowReference.move({ top: 0, left: 0 });
        }
    }

    protected onMinimizeClick(): void {
        if (this.minimized()) {
            this.minimized.set(false);
            this.windowData.windowReference.resize({
                width: this.windowData.windowReference.width,
                height: this.#sizeBeforeMinimize()
            });
        } else {
            this.#sizeBeforeMinimize.set(this.windowData.windowReference.height);
            this.minimized.set(true);
            this.windowData.windowReference.resize({
                width: this.windowData.windowReference.width,
                height: undefined
            });
        }
    }

    private closeWindow(event: Event): void {
        const closeEvent = new PopupCloseEvent({ event, via: PopupCloseSource.CloseButton, originalEvent: event });
        if (this.windowData.preventClose && this.windowData.preventClose(closeEvent)) {
            return;
        }
        this.windowData.windowReference.close(closeEvent);
    }

    private focusElement(): void {
        const element = this.windowData.focusedElement;
        if (!element) {
            return;
        }
        const windowElement = this.#hostElementRef.nativeElement;
        focusElement(windowElement, element);
    }

    #createView(): void {
        if (this.contentType() === "component" && this.componentAnchor() && this.componentRef) {
            const index = this.#viewContainerRef.indexOf(this.componentRef.hostView);
            if (index !== -1) {
                this.#viewContainerRef.detach(index);
            }
            this.componentAnchor().insert(this.componentRef.hostView, 0);
            this.componentRef.changeDetectorRef.detectChanges();
        }
    }
}
