import { computed, DestroyRef, ElementRef, inject, InjectionToken, signal } from "@angular/core";
import type { Provider, Signal } from "@angular/core";

/**
 * A control wrapped by a `mona-label` that has no native input, so the browser can't associate them.
 */
export interface MonaLabelledControl {
    readonly activate: () => void;
    readonly element: HTMLElement;
    /** Whether the control has a name of its own, through `aria-label` or `aria-labelledby`. */
    readonly named: () => boolean;
}

export interface MonaLabelContext {
    /** Id of the element holding the label's caption, or null when the label has no caption of its own. */
    readonly captionId: Signal<string | null>;
    /** Registers a wrapped control and returns the function that removes it. */
    readonly register: (control: MonaLabelledControl) => () => void;
}

/**
 * Provided by `mona-label` and `mona-form-field` to the content they wrap.
 */
export const MONA_LABEL = new InjectionToken<MonaLabelContext | null>("MONA_LABEL");

/**
 * A control inside a `mona-form-field`.
 */
export interface MonaFormFieldControl {
    /** What a click on the caption does, when it isn't just focus. Null for a control that only takes focus. */
    readonly activate: (() => void) | null;
    readonly element: HTMLElement;
    readonly focus: () => void;
}

export interface MonaFormFieldContext {
    /** Ids of the form field's hint and error, space-separated, or null while it shows neither. */
    readonly describedBy: Signal<string | null>;
    /** Registers a control and returns the function that removes it. */
    readonly register: (control: MonaFormFieldControl) => () => void;
}

/**
 * Provided by `mona-form-field` to the content it wraps, next to {@link MONA_LABEL}.
 */
export const MONA_FORM_FIELD = new InjectionToken<MonaFormFieldContext | null>("MONA_FORM_FIELD");

/**
 * View providers for a control that renders other controls in its own view, such as the inputs of a color gradient or
 * the filter of a dropdown's popup. A label or form field around the control names and describes the control itself;
 * these stop it from reaching the parts inside, which have names of their own.
 */
export const FIELD_ASSOCIATION_BOUNDARY: readonly Provider[] = [
    { provide: MONA_LABEL, useValue: null },
    { provide: MONA_FORM_FIELD, useValue: null }
];

export interface LabelAssociationOptions {
    /**
     * What a click on the caption does for a wrapped control. Leave it out when the control has a native input, since
     * the browser already handles that click.
     */
    readonly activate?: () => void;
    /** The control's own `aria-describedby`, which comes before a form field's hint and error. */
    readonly ariaDescribedBy?: () => string | null | undefined;
    readonly ariaLabel: () => string | null | undefined;
    readonly ariaLabelledBy: () => string | null | undefined;
    /** Moves focus to the control. A form field calls it on a click on its caption, unless `activate` is set. */
    readonly focus: () => void;
    /** False for a control that renders its own `<label>`, whose text must stay its name. */
    readonly wrapped?: boolean;
}

export interface LabelAssociation {
    /** The ids for `aria-describedby`: the control's own, then a form field's hint and error. */
    readonly describedBy: Signal<string | null>;
    /** The id for `aria-labelledby`. An explicit `aria-labelledby` wins, and an explicit `aria-label` turns it off. */
    readonly labelledBy: Signal<string | null>;
    /** Called by a label that points at the control through `[for]`. */
    readonly setLabelledBy: (id: string | null) => void;
}

/**
 * Connects a control to a `mona-label` or `label[monaLabel]` that names it, by wrapping it or through `[for]`, and to a
 * `mona-form-field` that names and describes it.
 *
 * The contexts are looked up from the parent element, past the control's own view providers, so a control that
 * declares {@link FIELD_ASSOCIATION_BOUNDARY} still reaches the label around it.
 */
export function injectLabelAssociation(options: LabelAssociationOptions): LabelAssociation {
    const lookup = { optional: true, skipSelf: true } as const;
    const context = options.wrapped === false ? null : inject(MONA_LABEL, lookup);
    const formField = inject(MONA_FORM_FIELD, lookup);
    const fromTarget = signal<string | null>(null);

    const { activate } = options;
    if (context && activate) {
        const element: HTMLElement = inject(ElementRef).nativeElement;
        const named = (): boolean => !!options.ariaLabel() || !!options.ariaLabelledBy();
        inject(DestroyRef).onDestroy(context.register({ activate, element, named }));
    }
    if (formField) {
        const element: HTMLElement = inject(ElementRef).nativeElement;
        const control: MonaFormFieldControl = { activate: activate ?? null, element, focus: options.focus };
        inject(DestroyRef).onDestroy(formField.register(control));
    }

    return {
        describedBy: computed(() => {
            const ids = [options.ariaDescribedBy?.(), formField?.describedBy()].filter(id => !!id).join(" ");
            return ids || null;
        }),
        labelledBy: computed(() => {
            const explicit = options.ariaLabelledBy();
            if (explicit) {
                return explicit;
            }
            if (options.ariaLabel()) {
                return null;
            }
            return fromTarget() ?? context?.captionId() ?? null;
        }),
        setLabelledBy: id => fromTarget.set(id)
    };
}
