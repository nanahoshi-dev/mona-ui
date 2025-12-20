import {
    computed,
    DestroyRef,
    Directive,
    effect,
    ElementRef,
    inject,
    input,
    model,
    OnInit,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ButtonVariantProps, ButtonVariantsInput, buttonThemeVariants } from "../styles/button.styles";
import { ThemeService } from "../../../theme/services/theme.service";
import { fromEvent, takeWhile } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonService } from "../../services/button.service";

@Directive({
    selector: "button[monaButton]",
    host: {
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "toggleable() ? selected() : undefined",
        "[attr.aria-haspopup]": "ariaHasPopup()",
        "[attr.aria-pressed]": "toggleable() ? selected() : undefined",
        "[attr.data-look]": "look()",
        "[attr.data-size]": "size()",
        "[attr.disabled]": "disabled() ? '' : undefined",
        "[attr.role]": "'button'",
        "[attr.tabindex]": "disabled() ? -1 : tabindex()",
        "[attr.type]": "'button'",
        "[class]": "classes()",
        "[class.mona-button]": "true",
        "[class.mona-selected]": "selected()"
    }
})
export class ButtonDirective implements OnInit, ButtonVariantsInput {
    readonly #buttonService = inject(ButtonService, { optional: true });
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLButtonElement> = inject(ElementRef);
    readonly #themeService = inject(ThemeService);
    protected readonly classes = computed(() => {
        const iconOnly = this.iconOnly();
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const selected = this.selected();
        const userClass = this.userClass();
        const theme = this.#themeService.theme();
        const variants = buttonThemeVariants(theme);
        const variantClasses = variants({ iconOnly, look, rounded, selected, size });
        return twMerge(variantClasses, userClass);
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
     * @description Sets the icon only state of the button.
     * When set to true, the button will appear as square.
     */
    public readonly iconOnly = input(false);

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
     *
     * If set to `true`, the button will toggle its selected state on click.
     */
    public readonly toggleable = input(false);
    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => {
            this.selected();
            untracked(() => {
                if (this.#buttonService) {
                    this.#buttonService.buttonSelected$.next(this);
                }
            });
        });
        effect(() => {
            const toggleable = this.toggleable();
            if (toggleable) {
                untracked(() => this.setToggleableEvent());
            }
        });
    }

    public ngOnInit(): void {
        this.#buttonService?.buttonSelect$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(result => {
            const [button, selected] = result;
            if (button === this) {
                this.selected.set(selected);
            }
        });
    }

    private setToggleableEvent(): void {
        fromEvent<MouseEvent>(this.#hostElementRef.nativeElement, "click")
            .pipe(
                takeUntilDestroyed(this.#destroyRef),
                takeWhile(() => this.toggleable())
            )
            .subscribe(() => {
                if (this.disabled()) {
                    return;
                }
                if (this.#buttonService) {
                    this.#buttonService.buttonClick$.next(this);
                } else {
                    this.selected.set(!this.selected());
                }
            });
    }
}
