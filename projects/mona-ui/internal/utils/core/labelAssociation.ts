import { computed, DestroyRef, ElementRef, inject, InjectionToken, signal } from "@angular/core";
import type { Signal } from "@angular/core";

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
 * Provided by `mona-label` to the content it wraps.
 */
export const MONA_LABEL = new InjectionToken<MonaLabelContext>("MONA_LABEL");

export interface LabelAssociationOptions {
    /**
     * What a click on the caption does for a wrapped control. Leave it out when the control has a native input, since
     * the browser already handles that click.
     */
    readonly activate?: () => void;
    readonly ariaLabel: () => string | null | undefined;
    readonly ariaLabelledBy: () => string | null | undefined;
    /** False for a control that renders its own `<label>`, whose text must stay its name. */
    readonly wrapped?: boolean;
}

export interface LabelAssociation {
    /** The id for `aria-labelledby`. An explicit `aria-labelledby` wins, and an explicit `aria-label` turns it off. */
    readonly labelledBy: Signal<string | null>;
    /** Called by a label that points at the control through `[for]`. */
    readonly setLabelledBy: (id: string | null) => void;
}

/**
 * Connects a control to a `mona-label` or `label[monaLabel]` that names it, by wrapping it or through `[for]`.
 */
export function injectLabelAssociation(options: LabelAssociationOptions): LabelAssociation {
    const context = options.wrapped === false ? null : inject(MONA_LABEL, { optional: true });
    const fromTarget = signal<string | null>(null);

    const { activate } = options;
    if (context && activate) {
        const element: HTMLElement = inject(ElementRef).nativeElement;
        const named = (): boolean => !!options.ariaLabel() || !!options.ariaLabelledBy();
        inject(DestroyRef).onDestroy(context.register({ activate, element, named }));
    }

    return {
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
