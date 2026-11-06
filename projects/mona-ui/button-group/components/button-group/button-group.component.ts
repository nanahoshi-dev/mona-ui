import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChildren,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    model,
    output,
    untracked
} from "@angular/core";
import { outputFromObservable, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { BUTTON_GROUP_MEMBER, ButtonDirective, ButtonService } from "@nanahoshi/mona-ui/button";
import { SelectionMode } from "@nanahoshi/mona-ui/common";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { injectEffectiveDisabled, injectLabelAssociation } from "@nanahoshi/mona-ui/internal";
import { filter, map } from "rxjs";
import { twMerge } from "tailwind-merge";
import { BUTTON_GROUP_DEFAULT_MESSAGES } from "../../i18n/button-group.default-messages";
import type { ButtonGroupClickEvent } from "../../models/ButtonGroupClickEvent";
import {
    buttonGroupThemeVariants,
    ButtonGroupVariantProps,
    ButtonGroupVariantsInput
} from "../../styles/button-group.styles";

@Component({
    selector: "mona-button-group",
    templateUrl: "./button-group.component.html",
    providers: [ButtonService],
    host: {
        "[attr.aria-invalid]": "invalidState() ? 'true' : null",
        "[attr.aria-label]": "labelledBy() ? null : ariaLabel() || messages().buttonGroup",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "(focusout)": "onFocusOut($event)",
        "[class]": "baseClass()",
        role: "group"
    }
})
export class ButtonGroupComponent<T = unknown>
    implements ButtonGroupVariantsInput, FormValueControl<T | readonly T[] | null | undefined>
{
    readonly #buttonService = inject(ButtonService, { self: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #label = injectLabelAssociation({
        activate: () => this.focus(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy()
    });
    /** The buttons seen selected last time, to tell which one is new and which one to bring back. */
    #lastSelected: readonly ButtonDirective[] = [];
    protected readonly baseClass = computed(() => {
        const look = this.look();
        const rounded = this.rounded();
        const size = this.size();
        const variantClasses = buttonGroupThemeVariants({ look, rounded, size });
        const userClass = this.userClass();
        return twMerge(variantClasses, userClass);
    });
    /**
     * The group's own buttons: they follow its look, size, rounding and disabled state, and its selection.
     */
    protected readonly buttons = contentChildren(ButtonDirective);
    /**
     * Dropdown and split buttons placed in the group. Their buttons follow the group's look, size, rounding and
     * disabled state, but not its selection.
     */
    protected readonly components = contentChildren(BUTTON_GROUP_MEMBER);
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly invalidState = computed(() => this.touched() && this.invalid());
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly members = computed(() => [
        ...this.buttons(),
        ...this.components().flatMap(component => component.groupButtons())
    ]);
    protected readonly messages = this.#i18n.componentMessages("buttonGroup", BUTTON_GROUP_DEFAULT_MESSAGES);

    /**
     * @description When `false` and `selection` is `"single"`, a selected button stays selected until another one takes
     * over: the active button can't be deselected, and clearing every `selected` brings it back. It doesn't choose a
     * first button, and a `value` of `null` still clears the group, so a form can reset it. Has no effect in `"multiple"`
     * mode.
     * @default true
     */
    public readonly allowEmpty = input(true, { transform: booleanAttribute });

    /**
     * @description Accessible name for the host element. Override when multiple button groups appear on the same page
     * so screen reader users can distinguish them.
     */
    public readonly ariaLabel = input<string | undefined>(undefined, { alias: "aria-label" });

    /**
     * @description Id of the element that names the group.
     * @default ""
     */
    public readonly ariaLabelledBy = input<string>("", { alias: "aria-labelledby" });

    /**
     * @description Emitted when a button placed directly in the group is clicked, toggleable or not, after the group has
     * applied its selection. Not emitted for a dropdown or split button's own buttons, or for a disabled button.
     */
    public readonly buttonClick = outputFromObservable<ButtonGroupClickEvent<T>>(
        this.#buttonService.memberClick$.pipe(
            filter(([button]) => this.buttons().includes(button)),
            map(([button, element]) => ({
                button: element,
                selected: button.selected(),
                value: button.value() as T | undefined
            })),
            takeUntilDestroyed(this.#destroyRef)
        )
    );

    /**
     * @description Renders all child buttons with reduced visual emphasis and removes pointer interaction. When bound to
     * a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the group as invalid. Error styling requires both `invalid` and `touched` to be `true`. When
     * bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Visual style variant propagated to all child buttons.
     * Also controls container-level divider and border behavior.
     * @default "outline"
     */
    public readonly look = input<ButtonGroupVariantProps["look"]>("outline");

    /**
     * @description Prevents selection changes while the buttons stay focusable. Buttons that aren't toggleable keep
     * working. When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the container and the outer corners of the first and last child button.
     * @default "medium"
     */
    public readonly rounded = input<ButtonGroupVariantProps["rounded"]>("medium");

    /**
     * @description Whether one button can be selected at a time (`"single"`) or each toggles on its own (`"multiple"`).
     * The buttons stay toggle buttons with `aria-pressed` in both. For a choice that must always hold one value, use
     * `mona-segmented`, which is a radio group.
     * @default "multiple"
     */
    public readonly selection = input<SelectionMode>("multiple");

    /**
     * @description Size preset propagated to all child buttons, overriding their individual `size` inputs.
     * @default "medium"
     */
    public readonly size = input<ButtonGroupVariantProps["size"]>("medium");

    /**
     * @description Emitted when a user changes the selection or focus leaves the group.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Marks the group as touched. When bound to a signal form field via `[formField]`, this is written by
     * the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The value of the selected button in `"single"` mode, or `null`, and an array of the selected buttons'
     * values in `"multiple"` mode. Buttons take part by having a `value`. While `undefined`, it leaves each button's
     * `selected` alone. A value with no button yet stays, so one that loads before its button isn't lost. Use either this
     * or `[(selected)]` on the buttons, not both.
     * @default undefined
     */
    public readonly value = model<T | readonly T[] | null | undefined>(undefined);

    public constructor() {
        this.#buttonService.setMembers(this.members);
        effect(() => {
            const disabled = this.effectiveDisabled();
            untracked(() => this.#buttonService.groupDisabled.set(disabled));
        });
        effect(() => {
            const readonly = this.readonly();
            untracked(() => this.#buttonService.groupReadonly.set(readonly));
        });
        effect(() => {
            const look = this.look();
            untracked(() => this.#buttonService.groupLook.set(look));
        });
        effect(() => {
            const rounded = this.rounded();
            untracked(() => this.#buttonService.groupRounded.set(rounded));
        });
        effect(() => {
            const size = this.size();
            untracked(() => this.#buttonService.groupSize.set(size));
        });
        effect(() => {
            const value = this.value();
            if (value === undefined) {
                return;
            }
            const values = this.valuesOf(value);
            for (const button of this.valueButtons()) {
                const selected = values.includes(button.value() as T);
                untracked(() => button.selected.set(selected));
            }
        });
        effect(() => {
            const buttons = this.buttons();
            const selected = buttons.filter(button => button.selected());
            const single = this.selection() === "single";
            const allowEmpty = this.allowEmpty();
            untracked(() => this.enforceSelectionPolicy(buttons, selected, single, allowEmpty));
        });
        afterNextRender({
            read: () => this.setSubscriptions()
        });
    }

    /**
     * @description Moves focus to the selected button, or the first enabled one.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        const host = this.#hostElementRef.nativeElement;
        const target =
            host.querySelector<HTMLButtonElement>("button[aria-pressed='true']:not(:disabled)") ??
            host.querySelector<HTMLButtonElement>("button:not(:disabled)");
        target?.focus(options);
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    protected onFocusOut(event: FocusEvent): void {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.#hostElementRef.nativeElement.contains(nextTarget)) {
            return;
        }
        this.touch.emit();
    }

    private commitValue(): void {
        const buttons = this.valueButtons();
        if (buttons.length === 0) {
            return;
        }
        const selected = buttons.filter(button => button.selected()).map(button => button.value() as T);
        if (this.selection() === "single") {
            this.value.set(selected[0] ?? null);
            return;
        }
        const known = buttons.map(button => button.value());
        const waiting = this.valuesOf(this.value()).filter(value => !known.includes(value));
        this.value.set([...waiting, ...selected]);
    }

    /**
     * Holds the group to `selection` and `allowEmpty` however a button's `selected` changed, since a binding can change
     * it as well as a click. A form's `value` of `null` is left alone, so the form can reset the group.
     */
    private enforceSelectionPolicy(
        buttons: readonly ButtonDirective[],
        selected: readonly ButtonDirective[],
        single: boolean,
        allowEmpty: boolean
    ): void {
        if (single && selected.length > 1) {
            // Both new, as on the first render, keeps the first. A new one next to an old one keeps the new one.
            const fresh = selected.filter(button => !this.#lastSelected.includes(button));
            const keep = fresh.length < selected.length ? (fresh[fresh.length - 1] ?? selected[0]) : selected[0];
            selected.filter(button => button !== keep).forEach(button => button.selected.set(false));
            this.#lastSelected = [keep];
            this.commitValue();
            return;
        }
        if (single && !allowEmpty && selected.length === 0 && this.value() === undefined) {
            const previous = this.#lastSelected.find(button => buttons.includes(button));
            previous?.selected.set(true);
            if (previous) {
                return;
            }
        }
        this.#lastSelected = selected;
    }

    private setSubscriptions(): void {
        this.#buttonService.buttonClick$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(([button, wasSelected]) => {
                if (this.readonly()) {
                    return;
                }
                if (this.selection() === "single") {
                    if (wasSelected && !this.allowEmpty()) {
                        return;
                    }
                    this.buttons().forEach(b => {
                        if (b.selected()) {
                            this.#buttonService.buttonSelect$.next([b, false]);
                        }
                    });
                    if (!wasSelected) {
                        this.#buttonService.buttonSelect$.next([button, true]);
                    }
                } else {
                    this.#buttonService.buttonSelect$.next([button, !wasSelected]);
                }
                this.commitValue();
                this.touch.emit();
            });
    }

    private valueButtons(): readonly ButtonDirective[] {
        return this.buttons().filter(button => button.effectiveToggleable() && button.value() !== undefined);
    }

    private valuesOf(value: T | readonly T[] | null | undefined): readonly T[] {
        if (value == null) {
            return [];
        }
        return Array.isArray(value) ? value : [value as T];
    }
}
