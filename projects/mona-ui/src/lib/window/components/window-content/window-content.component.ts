import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ApplicationRef,
    ChangeDetectionStrategy,
    Component,
    ComponentRef,
    computed,
    createComponent,
    DestroyRef,
    DOCUMENT,
    ElementRef,
    inject,
    Injector,
    signal,
    TemplateRef,
    viewChild,
    ViewContainerRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideAngularModule, Maximize, Minimize, Minus, X } from "lucide-angular";
import { filter, fromEvent, map, take, tap } from "rxjs";
import { AnimationService } from "../../../animations/services/animation.service";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { PopupCloseSource } from "../../../popup/models/PopupCloseEvent";
import { PopupDataInjectionToken } from "../../../popup/models/PopupInjectionToken";
import { ThemeService } from "../../../theme/services/theme.service";
import { WindowDragHandlerDirective } from "../../directives/window-drag-handler.directive";
import { WindowResizeHandlerDirective } from "../../directives/window-resize-handler.directive";
import { WindowCloseEvent } from "../../models/WindowCloseEvent";
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        WindowDragHandlerDirective,
        NgTemplateOutlet,
        ButtonDirective,
        WindowResizeHandlerDirective,
        LucideAngularModule,
        ResizePositionPipe
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class WindowContentComponent implements WindowContentVariantInput {
    readonly #animationService = inject(AnimationService);
    readonly #appRef = inject(ApplicationRef);
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #injector = inject(Injector);

    readonly #sizeBeforeMaximize = signal({ width: 0, height: 0, top: 0, left: 0 });
    readonly #sizeBeforeMinimize = signal(0);
    readonly #themeService = inject(ThemeService);
    readonly #viewContainerRef = inject(ViewContainerRef);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.windowData.rounded;
        return windowBaseThemeVariants(theme)({ rounded });
    });
    protected readonly closeIcon = X;
    protected readonly componentAnchor = viewChild.required("componentAnchor", {
        read: ViewContainerRef
    });
    protected readonly componentRef?: ComponentRef<any>;
    protected readonly contentClass = computed(() => {
        const theme = this.#themeService.theme();
        return windowContentThemeVariants(theme)();
    });
    protected readonly contentContainerClass = computed(() => {
        const theme = this.#themeService.theme();
        const rounded = this.windowData.rounded;
        return windowContentContainerThemeVariants(theme)({ rounded });
    });
    protected readonly contentType = signal<"template" | "component">("template");
    protected readonly maximizeIcon = computed(() => {
        return this.maximized() && !this.minimized() ? Minimize : Maximize;
    });
    protected readonly maximized = signal(false);
    protected readonly minimizeIcon = Minus;
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
        if (this.windowData.content instanceof TemplateRef) {
            this.contentType.set("template");
        } else {
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
        if (this.minimized()) {
            this.minimized.set(false);
            this.windowData.windowReference.resize({
                width: this.maximized() ? window.innerWidth : this.#sizeBeforeMaximize().width,
                height: this.maximized() ? window.innerHeight : this.#sizeBeforeMaximize().height,
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
                width: window.innerWidth,
                height: window.innerHeight
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
        const closeEvent = new WindowCloseEvent({ event, via: PopupCloseSource.CloseButton, originalEvent: event });
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
        if (element instanceof ElementRef) {
            element.nativeElement.focus();
        } else if (element instanceof HTMLElement) {
            element.focus();
        } else {
            const elements = windowElement.querySelectorAll(element);
            if (elements.length > 0) {
                (elements[0] as HTMLElement).focus();
            }
        }
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
