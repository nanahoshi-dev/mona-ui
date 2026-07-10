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
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { fromEvent, Subscription, takeWhile } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonService } from "../services/button.service";
import { BUTTON_STYLE_STRATEGY, ButtonVariantProps, ButtonVariantsInput } from "../styles/button.styles";

@Directive({
    selector: "button[monaButton]",
    host: {
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-disabled]": "effectiveDisabled() || loading() ? 'true' : undefined",
        "[attr.aria-haspopup]": "ariaHasPopup() !== 'false' ? ariaHasPopup() : null",
        "[attr.aria-pressed]": "displaysPressedState() ? (selected() ? 'true' : 'false') : undefined",
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
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLButtonElement> = inject(ElementRef);
    readonly #injector = inject(Injector);
    readonly #renderer = inject(Renderer2);
    readonly #styleStrategy = inject(BUTTON_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    #loaderComponentRef: ComponentRef<IndicatorIconComponent> | null = null;
    #toggleSubscription: Subscription | null = null;

    protected readonly displaysPressedState = computed(() => this.isInButtonGroup() || !!this.toggleable());
    protected readonly effectiveDisabled = computed(() => this.#buttonService?.groupDisabled() || this.disabled());
    protected readonly effectiveLook = computed(() => this.#buttonService?.groupLook() ?? this.look());
    protected readonly effectiveRounded = computed(() => this.#buttonService?.groupRounded() ?? this.rounded());
    protected readonly effectiveSize = computed(() => this.#buttonService?.groupSize() ?? this.size());
    protected readonly effectiveToggleable = computed(() => this.toggleable() ?? this.isInButtonGroup());
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
        const variants = this.#styleStrategy.resolve(theme);
        const variantClasses = variants({ disabled, iconOnly, loading, look, rounded, selected, size });
        return twMerge(variantClasses, userClass);
    });
    protected readonly loadingSize = computed(() => {
        const size = this.effectiveSize();
        switch (size) {
            case "small":
                return 12;
            case "large":
                return 16;
            case "medium":
            default:
                return 14;
        }
    });

    /**
     * @description Value forwarded to the `aria-haspopup` attribute. Set when this button triggers a popup, menu,
     * listbox, tree, grid, or dialog. Omit or leave as `"false"` for plain action buttons.
     * @default "false"
     */
    public readonly ariaHasPopup = input<string>("false", { alias: "aria-haspopup" });

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * When inside a `ButtonGroup`, the group's disabled state takes precedence.
     * @default false
     */
    public readonly disabled = model<boolean>(false);

    /**
     * @description Removes horizontal padding and fixes a square aspect ratio sized to match `size`.
     * Provide `aria-label` on the host when using icon-only buttons.
     * @default false
     */
    public readonly iconOnly = input(false);

    /**
     * @description Displays a loading indicator and prevents interaction while an operation is in progress.
     * Sets `aria-busy="true"` on the host.
     * @default false
     */
    public readonly loading = model<boolean>(false);

    /**
     * @description Visual style variant of the button. When inside a `ButtonGroup`, the group's look takes precedence.
     * @default "default"
     */
    public readonly look = model<ButtonVariantProps["look"]>("default");

    /**
     * @description Border-radius preset applied to the component.
     * When inside a `ButtonGroup`, the group's value takes precedence.
     * @default "medium"
     */
    public readonly rounded = input<ButtonVariantProps["rounded"]>("medium");

    /**
     * @description Whether the button is in the selected/pressed state. Drives `aria-pressed` when the button is toggleable.
     * Managed by `toggleable` click handling or by `ButtonGroup` selection policy.
     * @default false
     */
    public readonly selected = model(false);

    /**
     * @description Size preset controlling the button's height and horizontal padding.
     * When inside a `ButtonGroup`, the group's value takes precedence.
     * @default "medium"
     */
    public readonly size = input<ButtonVariantProps["size"]>("medium");

    /**
     * @description Tab index of the host element. Automatically overridden to `-1` when the button is disabled or loading.
     * Accepts a numeric string and converts it to a number.
     * @default 0
     */
    public readonly tabindex = input<number, number | string>(0, {
        transform: (value: number | string) => (typeof value === "string" ? parseInt(value, 10) : value)
    });

    /**
     * @description Enables toggle behavior — each click flips the `selected` state and `aria-pressed` is managed.
     * Must use `[toggleable]="true"` binding syntax, not bare attribute form.
     * @default undefined
     */
    public readonly toggleable = input<boolean>();

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

        this.#loaderComponentRef = createComponent(IndicatorIconComponent, {
            environmentInjector: this.#appRef.injector,
            elementInjector: this.#injector
        });
        this.#loaderComponentRef.setInput("preset", "loading");
        this.#loaderComponentRef.setInput("size", size);
        this.#loaderComponentRef.setInput("class", "self-center h-auto");
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
        this.#toggleSubscription?.unsubscribe();
        this.#toggleSubscription = fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
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
