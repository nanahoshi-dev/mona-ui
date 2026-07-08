import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
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
import { TextBoxComponent, TextBoxPrefixTemplateDirective } from "@mirei/mona-ui/text-box";
import { debounceTime, fromEvent, Subject } from "rxjs";
import { FilterChangeEvent } from "../../models/FilterChangeEvent";

@Component({
    selector: "mona-filter-input",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TextBoxComponent, FormsModule, TextBoxPrefixTemplateDirective],
    templateUrl: "./filter-input.component.html"
})
export class FilterInputComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject(ElementRef<HTMLElement>);
    protected readonly filter$ = new Subject<string>();
    protected readonly filterText = signal("");

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
                input.focus();
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
        this.filter$.pipe(debounceTime(this.debounce()), takeUntilDestroyed(this.#destroyRef)).subscribe(value => {
            const event = new FilterChangeEvent(value);
            this.filterChange.emit(event);
            if (!event.isDefaultPrevented()) {
                this.filterText.set(value);
            }
            this.focus();
        });
    }
}
