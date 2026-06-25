import {
    afterNextRender,
    ApplicationRef,
    ComponentRef,
    computed,
    createComponent,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    Renderer2,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent, takeWhile } from "rxjs";
import { twMerge } from "tailwind-merge";
import { LoadingIndicatorComponent } from "../../../common/loading-indicator/components/loading-indicator/loading-indicator.component";
import { ThemeService } from "../../../theme/services/theme.service";
import { ButtonService } from "../../services/button.service";
import { buttonThemeVariants, ButtonVariantProps, ButtonVariantsInput } from "../styles/button.styles";

@Directive({
    selector: "button[monaButton]",
    host: {
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-disabled]": "effectiveDisabled() || loading() ? 'true' : undefined",
        "[attr.aria-haspopup]": "ariaHasPopup()",
        "[attr.aria-pressed]": "effectiveToggleable() ? (selected() ? 'true' : 'false') : undefined",
        "[attr.data-look]": "effectiveLook()",
        "[attr.data-size]": "effectiveSize()",
        "[attr.disabled]": "effectiveDisabled() || loading() ? '' : undefined",
        "[attr.tabindex]": "effectiveDisabled() || loading() ? -1 : tabindex()",
        "[attr.type]": "'button'",
        "[class]": "baseClass()"
    }
})
export class ButtonDirective implements ButtonVariantsInput {
    readonly #appRef = inject(ApplicationRef);
    readonly #buttonService = inject(ButtonService, { optional: true });
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLButtonElement> = inject(ElementRef);
    readonly #injector = inject(Injector);
    readonly #renderer = inject(Renderer2);
    readonly #themeService = inject(ThemeService);
    #loaderComponentRef: ComponentRef<LoadingIndicatorComponent> | null = null;

    protected readonly effectiveDisabled = computed(() => this.#buttonService?.groupDisabled() || this.disabled());
    protected readonly effectiveLook = computed(() => this.#buttonService?.groupLook() ?? this.look());
    protected readonly effectiveRounded = computed(() => this.#buttonService?.groupRounded() ?? this.rounded());
    protected readonly effectiveSize = computed(() => this.#buttonService?.groupSize() ?? this.size());
    protected readonly effectiveToggleable = computed(() => this.isInButtonGroup() || this.toggleable());
    protected readonly isInButtonGroup = computed(() => !!this.#buttonService);

    protected readonly baseClass = computed(() => {
        const disabled = this.effectiveDisabled();
        const iconOnly = this.iconOnly();
        const loading = this.loading();
        const look = this.effectiveLook();
        const rounded = this.effectiveRounded();
        const size = this.effectiveSize();
        const selected = this.selected();
        const userClass = this.userClass();
        const theme = this.#themeService.theme();
        const variants = buttonThemeVariants(theme);
        const variantClasses = variants({ disabled, iconOnly, loading, look, rounded, selected, size });
        return twMerge(variantClasses, userClass);
    });
    protected readonly loadingSize = computed(() => {
        const size = this.effectiveSize();
        switch (size) {
            case "small":
                return 14;
            case "large":
                return 20;
            case "medium":
            default:
                return 16;
        }
    });

    /**
     * @description Sets the aria-haspopup attribute of the button.
     */
    public readonly ariaHasPopup = input<string>("false", { alias: "aria-haspopup" });

    /**
     * @description Sets the disabled state of the button.
     */
    public readonly disabled = model<boolean>(false);

    /**
     * @description Sets the icon-only state of the button.
     * When set to true, the button will appear as square.
     */
    public readonly iconOnly = input(false);

    /**
     * @description Sets the loading state of the button.
     * When set to true, the button will display a loading indicator and be disabled.
     */
    public readonly loading = model<boolean>(false);

    /**
     * @description Sets the look of the button.
     */
    public readonly look = model<ButtonVariantProps["look"]>("default");

    /**
     * @description Sets the border radius of the button.
     */
    public readonly rounded = input<ButtonVariantProps["rounded"]>("medium");

    /**
     * @description Sets the selected state of the button.
     */
    public readonly selected = model(false);

    /**
     * @description Sets the size of the button.
     */
    public readonly size = input<ButtonVariantProps["size"]>("medium");

    /**
     * @description Sets the tabindex of the button.
     */
    public readonly tabindex = input<number, number | string>(0, {
        transform: (value: number | string) => (typeof value === "string" ? parseInt(value, 10) : value)
    });

    /**
     * @description Sets the toggleable state of the button.
     * If set to `true`, the button will toggle its selected state on click.
     */
    public readonly toggleable = input(false);

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => {
            const toggleable = this.effectiveToggleable();
            if (toggleable) {
                untracked(() => this.#setToggleableEvent());
            }
        });
        effect(() => {
            const loading = this.loading();
            const loaderSize = this.loadingSize();
            untracked(() => {
                if (loading) {
                    this.#createLoader(loaderSize);
                } else {
                    this.#removeLoader();
                }
            });
        });
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    #createLoader(size: number): void {
        if (this.#loaderComponentRef) {
            return;
        }

        this.#loaderComponentRef = createComponent(LoadingIndicatorComponent, {
            environmentInjector: this.#appRef.injector,
            elementInjector: this.#injector
        });
        this.#loaderComponentRef.setInput("size", size);
        this.#appRef.attachView(this.#loaderComponentRef.hostView);

        const loaderElement = this.#loaderComponentRef.location.nativeElement;
        this.#renderer.insertBefore(
            this.#hostElementRef.nativeElement,
            loaderElement,
            this.#hostElementRef.nativeElement.firstChild
        );
    }

    #removeLoader(): void {
        if (this.#loaderComponentRef) {
            this.#appRef.detachView(this.#loaderComponentRef.hostView);
            this.#loaderComponentRef.destroy();
            this.#loaderComponentRef = null;
        }
    }

    #setSubscriptions(): void {
        this.#buttonService?.buttonSelect$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(result => {
            const [button, selected] = result;
            if (button === this) {
                this.selected.set(selected);
            }
        });
    }

    #setToggleableEvent(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                takeWhile(() => this.effectiveToggleable())
            )
            .subscribe(() => {
                if (this.effectiveDisabled()) {
                    return;
                }
                const wasSelected = this.selected();
                if (this.#buttonService) {
                    this.#buttonService.buttonClick$.next([this, wasSelected]);
                } else {
                    this.selected.set(!this.selected());
                }
            });
    }
}
