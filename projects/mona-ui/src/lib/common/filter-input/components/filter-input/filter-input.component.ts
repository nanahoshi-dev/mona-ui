import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    OnInit,
    output,
    signal,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { debounceTime, fromEvent, Subject } from "rxjs";
import { TextBoxComponent } from "../../../../inputs/text-box/components/text-box/text-box.component";
import { TextBoxPrefixTemplateDirective } from "../../../../inputs/text-box/directives/text-box-prefix-template.directive";
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
    readonly #injector = inject(Injector);
    protected readonly filter$ = new Subject<string>();
    protected readonly filterText = signal("");

    public readonly filter = input("");
    public readonly filterChange = output<FilterChangeEvent>();
    public readonly debounce = input(0);
    public readonly placeholder = input("");

    public constructor() {
        effect(() => {
            const filter = this.filter();
            untracked(() => {
                this.filterText.set(filter);
            });
        });
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
        });
        afterNextRender(
            () => {
                fromEvent<KeyboardEvent>(
                    this.#hostElementRef.nativeElement.querySelector("input") as HTMLElement,
                    "keydown"
                )
                    .pipe(takeUntilDestroyed(this.#destroyRef))
                    .subscribe((event: KeyboardEvent) => {
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                            event.preventDefault();
                            const input = event.target as HTMLInputElement;
                            input.selectionStart = input.selectionEnd = input.value.length;
                        }
                    });
            },
            { injector: this.#injector }
        );
    }
}
