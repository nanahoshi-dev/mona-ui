import {
    afterNextRender,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    OnInit,
    output,
    signal,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { LucideSearch } from "@lucide/angular";
import { FilterChangeEvent } from "@nanahoshi/mona-ui/common";
import { TextBoxComponent, TextBoxPrefixTemplateDirective } from "@nanahoshi/mona-ui/text-box";
import { debounce, fromEvent, Subject, timer } from "rxjs";

@Component({
    selector: "mona-filter-input",
    imports: [LucideSearch, TextBoxComponent, FormsModule, TextBoxPrefixTemplateDirective],
    templateUrl: "./filter-input.component.html"
})
export class FilterInputComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    protected readonly filter$ = new Subject<string>();
    protected readonly filterText = signal("");
    /**
     * When the input controls a list, it acts as a combobox (WAI-ARIA APG): focus stays in the input
     * and the highlighted option is exposed through `aria-activedescendant`.
     */
    protected readonly inputAttributes = computed(() => {
        const controls = this.controls();
        const ariaLabel = this.ariaLabel() || null;
        if (!controls) {
            return { "aria-label": ariaLabel, "aria-controls": this.ariaControls() || null };
        }
        return {
            role: "combobox",
            "aria-label": ariaLabel,
            "aria-activedescendant": this.activeDescendant() || null,
            "aria-autocomplete": "list",
            "aria-controls": controls,
            "aria-expanded": true
        };
    });

    /**
     * @description Id of the highlighted option in the controlled list, exposed as `aria-activedescendant`.
     * @default ""
     */
    public readonly activeDescendant = input<string | null>("");

    /**
     * @description Id of the element this input filters, exposed as `aria-controls`. Unlike `controls`, the input
     * stays a text box: focus moves to the filtered element to navigate it.
     * @default ""
     */
    public readonly ariaControls = input("");

    /**
     * @description Accessible name of the input. The placeholder is not a reliable label, so set this whenever possible.
     * @default ""
     */
    public readonly ariaLabel = input("");

    /**
     * @description Focuses the input when it renders, as a popup's filter does. Turn it off for an input that is part
     * of the page, so it doesn't take focus on load.
     * @default true
     */
    public readonly autoFocus = input(true);

    /**
     * @description Id of the list this input filters. When set, the input is exposed as a combobox controlling it.
     * @default ""
     */
    public readonly controls = input("");

    public readonly debounce = input(0);
    public readonly filter = input("");
    public readonly filterChange = output<FilterChangeEvent>();
    public readonly inputBlur = output<FocusEvent>();
    public readonly inputFocus = output<FocusEvent>();
    public readonly placeholder = input("");
    public readonly size = input<ReturnType<TextBoxComponent["size"]>>("medium");

    public constructor() {
        effect(() => {
            const filter = this.filter();
            untracked(() => this.filterText.set(filter));
        });
        afterNextRender({
            read: () => {
                const input = this.#hostElementRef.nativeElement.querySelector("input") as HTMLInputElement;
                if (this.autoFocus()) {
                    input.focus();
                }
                fromEvent<KeyboardEvent>(input, "keydown")
                    .pipe(takeUntilDestroyed(this.#destroyRef))
                    .subscribe((event: KeyboardEvent) => {
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                            event.preventDefault();
                            const input = event.target as HTMLInputElement;
                            input.selectionStart = input.selectionEnd = input.value.length;
                        } else if (event.key !== "Escape" && event.key !== "Enter") {
                            event.stopPropagation();
                        }
                    });
            }
        });
    }

    public focus(): void {
        const input = this.#hostElementRef.nativeElement.querySelector("input") as HTMLInputElement;
        input.focus();
    }

    public ngOnInit(): void {
        this.setSubscriptions();
    }

    private setSubscriptions(): void {
        this.filter$
            .pipe(
                debounce(() => timer(this.debounce())),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(value => {
                const event = new FilterChangeEvent(value);
                this.filterChange.emit(event);
                if (!event.isDefaultPrevented()) {
                    this.filterText.set(value);
                }
                this.focus();
            });
    }
}
