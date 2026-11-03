import {
    afterNextRender,
    ApplicationRef,
    booleanAttribute,
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
    numberAttribute,
    Renderer2,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { IndicatorIconComponent } from "@nanahoshi/mona-ui/internal/indicator-icon";
import { fromEvent, Subscription, takeWhile } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonService } from "../services/button.service";
import { buttonThemeVariants, ButtonVariantProps, ButtonVariantsInput } from "../styles/button.styles";

@Directive({
    selector: "button[monaButton]",
    host: {
        "[attr.aria-busy]": "loading() ? 'true' : undefined",
        "[attr.aria-disabled]": "effectiveDisabled() || loading() ? 'true' : undefined",
        "[attr.aria-haspopup]": "ariaHasPopup() !== 'false' ? ariaHasPopup() : null",
        "[attr.aria-pressed]": "effectiveToggleable() ? (selected() ? 'true' : 'false') : undefined",
        "[attr.data-look]": "effectiveLook()",
        "[attr.data-size]": "effectiveSize()",
        "[attr.disabled]": "effectiveDisabled() ? '' : undefined",
        "[attr.tabindex]": "effectiveDisabled() ? -1 : tabindex()",
        "[attr.type]": "type()",
        "[class]": "baseClass()"
    }
})
export class ButtonDirective implements ButtonVariantsInput {
    readonly #appRef = inject(ApplicationRef);
    readonly #buttonService = inject(ButtonService, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    /**
     * The service of the group this button belongs to. A `ButtonService` higher up the injector tree is not enough:
     * buttons inside a component projected into a group, or inside a popup opened from one, are not members.
     */
    readonly #group = computed(() => (this.#buttonService?.members().includes(this) ? this.#buttonService : null));
    readonly #hostElementRef: ElementRef<HTMLButtonElement> = inject(ElementRef);
    readonly #injector = inject(Injector);
    readonly #renderer = inject(Renderer2);
    #loaderComponentRef: ComponentRef<IndicatorIconComponent> | null = null;
    #toggleSubscription: Subscription | null = null;

    protected readonly baseClass = computed(() => {
        const disabled = this.effectiveDisabled();
        const iconOnly = this.iconOnly();
        const loading = this.loading();
        const look = this.effectiveLook();
        const rounded = this.effectiveRounded();
        const size = this.effectiveSize();
        const selected = this.selected();
        const userClass = this.userClass();
        const variantClasses = buttonThemeVariants({ disabled, iconOnly, loading, look, rounded, selected, size });
        return twMerge(variantClasses, userClass);
    });
    protected readonly effectiveDisabled = computed(() => this.#group()?.groupDisabled() || this.disabled());
    protected readonly effectiveLook = computed(() => this.#group()?.groupLook() ?? this.look());
    protected readonly effectiveRounded = computed(() => this.#group()?.groupRounded() ?? this.rounded());
    protected readonly effectiveSize = computed(() => this.#group()?.groupSize() ?? this.size());
    protected readonly effectiveToggleable = computed(() => this.toggleable() ?? !!this.#group());
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
     * Accepts the bare attribute form (`<button monaButton disabled>`).
     * When inside a `ButtonGroup`, the button is disabled when either it or the group is disabled.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Removes horizontal padding and fixes a square aspect ratio sized to match `size`.
     * Provide `aria-label` on the host when using icon-only buttons.
     * @default false
     */
    public readonly iconOnly = input(false, { transform: booleanAttribute });

    /**
     * @description Displays a loading indicator and prevents interaction while an operation is in progress.
     * Sets `aria-busy="true"` and `aria-disabled="true"` on the host. The button stays focusable, so keyboard focus
     * isn't lost when loading starts, and clicks (including form submission) are blocked until it ends.
     * @default false
     */
    public readonly loading = input(false, { transform: booleanAttribute });

    /**
     * @description Visual style variant of the button. When inside a `ButtonGroup`, the group's look takes precedence.
     * `"outline"` looks the same as `"default"`. `"clear"` shows no selected state, so use another look for
     * toggle buttons.
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
     * @description Tab index of the host element. Automatically overridden to `-1` when the button is disabled.
     * Accepts a numeric string and converts it to a number; a value that is not a number falls back to `0`.
     * @default 0
     */
    public readonly tabindex = input<number, number | string>(0, {
        transform: (value: number | string) => numberAttribute(value, 0)
    });

    /**
     * @description Enables toggle behavior — each click flips the `selected` state and `aria-pressed` is managed.
     * Accepts the bare attribute form. Buttons in a `ButtonGroup` are toggleable unless this is set to `false`.
     * @default undefined
     */
    public readonly toggleable = input<boolean | undefined, unknown>(undefined, {
        transform: (value: unknown) => (value === undefined ? undefined : booleanAttribute(value))
    });

    /**
     * @description Native `type` attribute of the button. Defaults to `"button"` to prevent accidental
     * form submission; set to `"submit"` or `"reset"` explicitly when that behavior is intended.
     * @default "button"
     */
    public readonly type = input<"button" | "reset" | "submit">("button");

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
        this.#blockClicksWhileLoading();
        this.#destroyRef.onDestroy(() => this.#removeLoader());
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    /**
     * A loading button keeps focus, so it is not natively disabled. A capturing listener registered before any other
     * stops activation from reaching the user's handlers, the toggle handler and form submission.
     */
    #blockClicksWhileLoading(): void {
        const host = this.#hostElementRef.nativeElement;
        const listener = (event: MouseEvent): void => {
            if (this.loading()) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };
        host.addEventListener("click", listener, { capture: true });
        this.#destroyRef.onDestroy(() => host.removeEventListener("click", listener, { capture: true }));
    }

    #createLoader(size: number): void {
        if (this.#loaderComponentRef) {
            this.#loaderComponentRef.setInput("size", size);
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
                const group = this.#group();
                if (group) {
                    group.buttonClick$.next([this, wasSelected]);
                } else {
                    this.selected.set(!this.selected());
                }
            });
    }
}
