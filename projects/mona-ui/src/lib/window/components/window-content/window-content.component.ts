import { NgTemplateOutlet } from "@angular/common";
import {
    AfterViewInit,
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
    OnInit,
    signal,
    TemplateRef,
    viewChild,
    ViewContainerRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideAngularModule, Maximize, Minimize, Minus, X } from "lucide-angular";
import { filter, fromEvent } from "rxjs";
import { AnimationService } from "../../../animations/services/animation.service";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { PopupCloseSource } from "../../../popup/models/PopupCloseEvent";
import { PopupDataInjectionToken } from "../../../popup/models/PopupInjectionToken";
import { ThemeService } from "../../../theme/services/theme.service";
import { WindowDragHandlerDirective } from "../../directives/window-drag-handler.directive";
import { WindowResizeHandlerDirective } from "../../directives/window-resize-handler.directive";
import { WindowCloseEvent } from "../../models/WindowCloseEvent";
import { WindowInjectorData } from "../../models/WindowInjectorData";
import {
    windowBaseThemeVariants,
    windowContentContainerThemeVariants,
    WindowContentVariantInput,
    windowTitleBarThemeVariants,
    windowTitleContainerThemeVariants
} from "../../styles/window.styles";

@Component({
    selector: "mona-window-content",
    templateUrl: "./window-content.component.html",
    styleUrls: ["./window-content.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        WindowDragHandlerDirective,
        NgTemplateOutlet,
        ButtonDirective,
        WindowResizeHandlerDirective,
        LucideAngularModule
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class WindowContentComponent implements OnInit, AfterViewInit, WindowContentVariantInput {
    readonly #animationService = inject(AnimationService);
    readonly #appRef = inject(ApplicationRef);
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef: ElementRef<HTMLElement> = inject(ElementRef);
    readonly #injector = inject(Injector);

    readonly #sizeBeforeMaximize = signal({ width: 0, height: 0 });
    readonly #themeService = inject(ThemeService);
    readonly #viewContainerRef = inject(ViewContainerRef);
    readonly #windowHeight = computed(() => {
        const maximized = this.maximized();
        return maximized ? window.innerHeight : this.#sizeBeforeMaximize().height;
    });
    readonly #windowWidth = computed(() => {
        const maximized = this.maximized();
        return maximized ? window.innerWidth : this.#sizeBeforeMaximize().width;
    });
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
    protected readonly titleBarClass = computed(() => {
        const theme = this.#themeService.theme();
        return windowTitleBarThemeVariants(theme)();
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
    }

    public ngAfterViewInit(): void {
        if (this.contentType() === "component" && this.componentAnchor() && this.componentRef) {
            const index = this.#viewContainerRef.indexOf(this.componentRef.hostView);
            if (index !== -1) {
                this.#viewContainerRef.detach(index);
            }
            this.componentAnchor().insert(this.componentRef.hostView, 0);
            this.componentRef.changeDetectorRef.detectChanges();
        }
        this.focusElement();
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    public onCloseClick(event: MouseEvent): void {
        this.closeWindow(event);
    }

    protected onMaximizeClick(): void {
        if (this.minimized()) {
            this.minimized.set(false);
            this.windowData.windowReference.resize({
                width: this.#windowWidth(),
                height: this.#windowHeight()
            });
            return;
        }
        if (!this.maximized()) {
            const width = this.windowData.windowReference.width;
            const height = this.windowData.windowReference.height;
            this.#sizeBeforeMaximize.set({ width, height });
        }
        this.maximized.update(maximized => !maximized);
        this.windowData.windowReference.resize({
            width: this.#windowWidth(),
            height: this.#windowHeight(),
            center: true
        });
    }

    protected onMinimizeClick(): void {
        this.minimized.update(minimized => !minimized);
        if (this.minimized()) {
            const width = this.windowData.windowReference.width;
            const height = this.windowData.windowReference.height;
            this.#sizeBeforeMaximize.set({ width, height });
            this.windowData.windowReference.resize({ width, height: undefined });
        }
    }

    private closeWindow(event: Event): void {
        const closeEvent = new WindowCloseEvent({ event, via: PopupCloseSource.CloseButton, originalEvent: event });
        if (this.windowData.preventClose && this.windowData.preventClose(closeEvent)) {
            return;
        }
        this.windowData.windowReference.beforeClose$$.next(closeEvent);
        if (closeEvent.isDefaultPrevented()) {
            return;
        }
        this.#animationService.fadeOut(this.windowData.windowReference.element);
        this.windowData.windowReference.closeWithDelay(100, closeEvent);
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

    private setSubscriptions(): void {
        if (this.windowData.closeOnEscape) {
            fromEvent<KeyboardEvent>(this.#document, "keydown")
                .pipe(
                    filter(event => event.key === "Escape"),
                    takeUntilDestroyed(this.#destroyRef)
                )
                .subscribe(event => this.closeWindow(event));
        }
    }
}
