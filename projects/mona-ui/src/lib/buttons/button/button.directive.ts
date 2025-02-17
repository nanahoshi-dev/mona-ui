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
import { ButtonVariantProps, buttonVariants, ButtonVariantsInput } from "mona-ui/buttons/button/button.style";
import { fromEvent, takeWhile } from "rxjs";
import { twMerge } from "tailwind-merge";
import { ButtonService } from "../services/button.service";

@Directive({
    selector: "button[monaButton]",
    host: {
        "[attr.aria-describedby]": "ariaDescribedby()",
        "[attr.aria-disabled]": "disabled() ? true : undefined",
        "[attr.aria-expanded]": "toggleable() ? selected() : undefined",
        "[attr.aria-haspopup]": "false",
        "[attr.aria-label]": "ariaLabel()",
        "[attr.aria-labelledby]": "ariaLabelledby()",
        "[attr.aria-pressed]": "toggleable() ? selected() : undefined",
        "[attr.aria-selected]": "selected() ? true : undefined",
        "[attr.data-look]": "look()",
        "[attr.data-size]": "size()",
        "[attr.disabled]": "disabled() ? '' : undefined",
        "[attr.role]": "'button'",
        "[attr.tabindex]": "tabindex()",
        "[attr.type]": "'button'",
        "[class]": "classes()",
        "[class.mona-button]": "true",
        // "[class.mona-disabled]": "disabled()",
        // "[class.mona-flat]": "flat()",
        // "[class.mona-primary]": "primary()",
        "[class.mona-selected]": "selected()"
    },
    standalone: true
})
export class ButtonDirective implements OnInit, ButtonVariantsInput {
    readonly #buttonService = inject(ButtonService, { optional: true });
    readonly #destroyRef: DestroyRef = inject(DestroyRef);
    readonly #hostElementRef: ElementRef<HTMLButtonElement> = inject(ElementRef);
    protected readonly classes = computed(() => {
        const look = this.look();
        const size = this.size();
        const selected = this.selected();
        const userClass = this.userClass();
        const variantClasses = buttonVariants({ look, selected, size });
        return twMerge(variantClasses, userClass);
    });
    public readonly ariaDescribedby = input<string>("");
    public readonly ariaLabel = input<string>("");
    public readonly ariaLabelledby = input<string>("");
    public readonly disabled = model<boolean>(false);
    public readonly flat = input(false);
    public readonly look = model<ButtonVariantProps["look"]>("default");
    /**
     * @deprecated Use `look` instead.
     */
    public readonly primary = input(false);
    public readonly selected = model(false);
    public readonly size = input<ButtonVariantProps["size"]>("default");
    public readonly tabindex = input<number, number | string>(0, {
        transform: (value: number | string) => (typeof value === "string" ? parseInt(value, 10) : value)
    });
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
            const disabled = this.disabled();
            const tabindex = this.tabindex();
            untracked(() => {
                this.#hostElementRef.nativeElement.tabIndex = disabled ? -1 : tabindex;
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
