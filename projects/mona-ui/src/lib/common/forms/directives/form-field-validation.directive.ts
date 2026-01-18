import { DestroyRef, Directive, effect, ElementRef, inject, signal, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NgControl } from "@angular/forms";
import { fromEvent, merge, startWith } from "rxjs";
import { FormFieldValidationService } from "../services/form-field-validation.service";

@Directive({
    selector: "[monaFormFieldValidation]",
    host: {
        "[attr.aria-invalid]": "invalid() ? 'true' : undefined"
    }
})
export class FormFieldValidationDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #formFieldValidationService = inject(FormFieldValidationService, { optional: true });
    readonly #ngControl = inject(NgControl, { optional: true, self: true });
    protected readonly invalid = signal(false);

    public constructor() {
        queueMicrotask(() => this.setupStatusTracking());
        effect(() => {
            const invalid = this.invalid();
            untracked(() => this.#formFieldValidationService?.invalid.set(invalid));
        });
    }

    private setupStatusTracking(): void {
        const control = this.#ngControl?.control;
        if (!control) {
            return;
        }
        const blur$ = fromEvent(this.#elementRef.nativeElement, "blur");
        merge(control.statusChanges, control.valueChanges, blur$)
            .pipe(startWith(null), takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => this.invalid.set(control.invalid && control.touched));
    }
}
