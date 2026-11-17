import { NgTemplateOutlet } from "@angular/common";
import {
    afterRenderEffect,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    ElementRef,
    inject,
    input,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { FormField } from "@angular/forms/signals";
import { formatGregorianDateToLocaleString, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    addAriaReference,
    createElementControlId,
    MONA_FORM_FIELD,
    MONA_LABEL,
    removeAriaReference
} from "@nanahoshi/mona-ui/internal";
import type { MonaFormFieldContext, MonaFormFieldControl, MonaLabelContext } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { FormFieldErrorTemplateDirective } from "../../directives/form-field-error-template.directive";
import { FormFieldHintTemplateDirective } from "../../directives/form-field-hint-template.directive";
import { FormFieldLabelTemplateDirective } from "../../directives/form-field-label-template.directive";
import { FORM_FIELD_DEFAULT_MESSAGES } from "../../i18n/form-field.default-messages";
import type { FormFieldErrorTemplateContext } from "../../models/FormFieldErrorTemplateContext";
import type { FormFieldOrientation } from "../../models/FormFieldOrientation";
import {
    formFieldControlThemeVariants,
    formFieldErrorItemThemeVariants,
    formFieldErrorThemeVariants,
    formFieldHintThemeVariants,
    formFieldLabelThemeVariants,
    formFieldOptionalThemeVariants,
    formFieldRequiredThemeVariants,
    formFieldThemeVariants
} from "../../styles/form-field.styles";
import { formFieldErrorMessage } from "../../utils/form-field-error-message";

/** A native element the form field names and describes itself, because no Mona UI control registered. */
type NativeFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const isNativeFormControl = (element: Element | null | undefined): element is NativeFormControl =>
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement;

/**
 * Puts a label, a hint and validation errors around one form control, and connects them to it.
 */
@Component({
    selector: "mona-form-field",
    templateUrl: "./form-field.component.html",
    imports: [NgTemplateOutlet],
    providers: [
        { provide: MONA_LABEL, useFactory: () => inject(FormFieldComponent).labelContext },
        { provide: MONA_FORM_FIELD, useFactory: () => inject(FormFieldComponent).fieldContext }
    ],
    host: {
        "[attr.data-invalid]": "errors().length > 0 || null",
        "[attr.data-orientation]": "orientation()",
        "[attr.data-required]": "requiredShown() || null",
        "[class]": "classes()"
    }
})
export class FormFieldComponent {
    readonly #controls = signal<readonly MonaFormFieldControl[]>([]);
    readonly #i18n = inject(MonaI18nService);
    protected readonly boundField = contentChild(FormField, { descendants: true });
    protected readonly captionId = createElementControlId();
    protected readonly classes = computed(() =>
        twMerge(formFieldThemeVariants({ orientation: this.orientation() }), this.userClass())
    );
    protected readonly controlClasses = computed(() =>
        formFieldControlThemeVariants({ orientation: this.orientation() })
    );
    protected readonly controlRef = viewChild.required<ElementRef<HTMLElement>>("control");
    protected readonly describedBy = computed(() => {
        const ids = [this.hintShown() ? this.hintId : null, this.errors().length ? this.errorId : null];
        return ids.filter(id => id !== null).join(" ") || null;
    });
    protected readonly errorClasses = computed(() => formFieldErrorThemeVariants({ orientation: this.orientation() }));
    protected readonly errorId = createElementControlId();
    protected readonly errorItemClasses = formFieldErrorItemThemeVariants();
    protected readonly errorTemplate = contentChild(FormFieldErrorTemplateDirective, { read: TemplateRef });
    protected readonly errors = computed<readonly FormFieldErrorTemplateContext[]>(() => {
        const shown: FormFieldErrorTemplateContext[] = [];
        const ownError = this.error();
        if (ownError) {
            shown.push({ $implicit: ownError, error: null, message: ownError });
        }
        const field = this.boundField();
        if (field?.state().touched()) {
            const messages = this.messages();
            const localeId = this.#i18n.localeId();
            const formatDate = (date: Date): string =>
                formatGregorianDateToLocaleString(date, localeId, { year: "numeric", month: "long", day: "numeric" });
            for (const error of field.errors()) {
                const message = formFieldErrorMessage(error, messages, formatDate);
                shown.push({ $implicit: message, error, message });
            }
        }
        return shown;
    });
    protected readonly hintClasses = computed(() => formFieldHintThemeVariants({ orientation: this.orientation() }));
    protected readonly hintId = createElementControlId();
    protected readonly hintShown = computed(() => !!this.hint() || !!this.hintTemplate());
    protected readonly hintTemplate = contentChild(FormFieldHintTemplateDirective, { read: TemplateRef });
    protected readonly labelClasses = computed(() => formFieldLabelThemeVariants({ orientation: this.orientation() }));
    protected readonly labelShown = computed(() => !!this.label() || !!this.labelTemplate());
    protected readonly labelTemplate = contentChild(FormFieldLabelTemplateDirective, { read: TemplateRef });
    protected readonly messages = this.#i18n.componentMessages("formField", FORM_FIELD_DEFAULT_MESSAGES);
    protected readonly optionalClasses = formFieldOptionalThemeVariants();
    protected readonly requiredClasses = formFieldRequiredThemeVariants();
    protected readonly requiredShown = computed(
        () => this.showRequiredMarker() && (this.required() || (this.boundField()?.state().required() ?? false))
    );

    /**
     * @description Text shown as an error, whether or not the control is touched, such as an error from a server. It
     * comes before the errors of a bound signal form field. Set the control's own `invalid` and `touched` too, so it
     * draws its error state.
     * @default ""
     */
    public readonly error = input("");

    /**
     * @internal
     */
    public readonly fieldContext: MonaFormFieldContext = {
        describedBy: this.describedBy,
        register: control => {
            this.#controls.update(controls => [...controls, control]);
            return () => this.#controls.update(controls => controls.filter(registered => registered !== control));
        }
    };

    /**
     * @description Help text shown below the control. It describes the control through `aria-describedby`. Ignored
     * when `monaFormFieldHintTemplate` is provided.
     * @default ""
     */
    public readonly hint = input("");

    /**
     * @description The label shown above or beside the control. It names the control through `aria-labelledby`.
     * Ignored when `monaFormFieldLabelTemplate` is provided.
     * @default ""
     */
    public readonly label = input("");

    /**
     * @internal
     */
    public readonly labelContext: MonaLabelContext = {
        captionId: computed(() => (this.labelShown() ? this.captionId : null)),
        // The form field registers every control through fieldContext, which also covers controls with a native input.
        register: () => () => undefined
    };

    /**
     * @description Whether to show optional-field text after the label.
     * @default false
     */
    public readonly optional = input(false, { transform: booleanAttribute });

    /**
     * @description Text shown after the label when `optional` is set.
     * @default the `formField.optional` message
     */
    public readonly optionalText = input("");

    /**
     * @description Where the label goes: above the control, or beside it in a column set by the
     * `--mona-form-field-label-width` custom property (10rem by default).
     * @default "vertical"
     */
    public readonly orientation = input<FormFieldOrientation>("vertical");

    /**
     * @description Shows the required marker after the label. A bound signal form field with a `required` rule shows it
     * too. The marker is hidden from assistive technology, which reads the control's own required state.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Whether a required field shows its marker. Turn it off for a form that marks optional fields instead.
     * @default true
     */
    public readonly showRequiredMarker = input(true, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        // A native input, select or text area has no Mona UI control to read the context, so its attributes are set here.
        afterRenderEffect({
            write: onCleanup => {
                const target = this.#nativeTarget();
                if (!target) {
                    return;
                }
                const labelId = this.labelContext.captionId();
                const named = target.hasAttribute("aria-label") || target.hasAttribute("aria-labelledby");
                const labelledBy = labelId && !named ? labelId : null;
                const describedBy = this.describedBy()?.split(" ") ?? [];
                const invalid = this.errors().length > 0 && !target.hasAttribute("aria-invalid");
                if (labelledBy) {
                    addAriaReference(target, "aria-labelledby", labelledBy);
                }
                for (const id of describedBy) {
                    addAriaReference(target, "aria-describedby", id);
                }
                if (invalid) {
                    target.setAttribute("aria-invalid", "true");
                }
                onCleanup(() => {
                    if (labelledBy) {
                        removeAriaReference(target, "aria-labelledby", labelledBy);
                    }
                    for (const id of describedBy) {
                        removeAriaReference(target, "aria-describedby", id);
                    }
                    if (invalid) {
                        target.removeAttribute("aria-invalid");
                    }
                });
            }
        });
    }

    protected onLabelClick(event: MouseEvent): void {
        if (event.defaultPrevented) {
            return;
        }
        const [control] = this.#controls();
        if (control) {
            (control.activate ?? control.focus)();
            return;
        }
        this.#nativeTarget()?.focus();
    }

    #nativeTarget(): NativeFormControl | null {
        if (this.#controls().length) {
            return null;
        }
        const bound = this.boundField()?.element;
        if (isNativeFormControl(bound)) {
            return bound;
        }
        const found = this.controlRef().nativeElement.querySelector("input:not([type='hidden']), select, textarea");
        return isNativeFormControl(found) ? found : null;
    }
}
