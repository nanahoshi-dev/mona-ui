import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChildren,
    effect,
    ElementRef,
    inject,
    input,
    isDevMode,
    model,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { type FormValueControl } from "@angular/forms/signals";
import { LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    AttributeBinderDirective,
    type AttributeConfig,
    createElementControlId,
    injectEffectiveDisabled,
    injectLabelAssociation
} from "@nanahoshi/mona-ui/internal";
import { injectLiveAnnouncer } from "@nanahoshi/mona-ui/internal/live-announcer";
import { twMerge } from "tailwind-merge";
import { MaskedTextBoxPrefixTemplateDirective } from "../../directives/masked-text-box-prefix-template.directive";
import { MaskedTextBoxSuffixTemplateDirective } from "../../directives/masked-text-box-suffix-template.directive";
import { MASKED_TEXT_BOX_DEFAULT_MESSAGES } from "../../i18n/masked-text-box.default-messages";
import type { MaskRules } from "../../models/MaskRules";
import {
    MASKED_TEXT_BOX_FIELD_CLASSES,
    MASKED_TEXT_BOX_GHOST_CLASSES,
    MASKED_TEXT_BOX_INPUT_CLASSES,
    maskedTextBoxThemeVariants,
    type MaskedTextBoxVariantInput,
    type MaskedTextBoxVariantProps
} from "../../styles/masked-text-box.styles";
import {
    displayMask,
    editMask,
    emptySlots,
    type MaskEditKind,
    type MaskSlot,
    type MaskSlots,
    parseMask,
    partAt,
    slotsComplete,
    slotsFromValue,
    valueFromSlots
} from "../../utils/mask";

/** A state the undo history can go back to. */
interface MaskSnapshot {
    readonly caret: number;
    readonly slots: MaskSlots;
}

/** The edits the box makes itself, by `beforeinput` type. Anything else is left to the browser and fitted after. */
const EDIT_KINDS: Readonly<Record<string, MaskEditKind>> = {
    deleteByCut: "deleteBackward",
    deleteByDrag: "deleteBackward",
    deleteContent: "deleteForward",
    deleteContentBackward: "deleteBackward",
    deleteContentForward: "deleteForward",
    deleteHardLineBackward: "deleteToStart",
    deleteHardLineForward: "deleteToEnd",
    deleteSoftLineBackward: "deleteToStart",
    deleteSoftLineForward: "deleteToEnd",
    deleteWordBackward: "deleteGroupBackward",
    deleteWordForward: "deleteGroupForward",
    insertFromDrop: "insert",
    insertFromPaste: "insert",
    insertFromPasteAsQuotation: "insert",
    insertFromYank: "insert",
    insertReplacementText: "insert",
    insertText: "insert"
};

const HISTORY_LIMIT = 100;

/**
 * A text box that takes a value in a fixed format, such as a phone number or a postal code. Each character goes into
 * a slot of the mask, and the mask's literals, such as the parentheses and dash of `(000) 000-0000`, are filled in as
 * you type. The rest of the mask shows after what's typed, so the format is in view.
 */
@Component({
    selector: "mona-masked-text-box",
    templateUrl: "./masked-text-box.component.html",
    imports: [NgTemplateOutlet, ButtonDirective, AttributeBinderDirective, LucideX],
    host: {
        // The ARIA inputs below are applied to the inner input, so the host must not keep the static attributes.
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.data-complete]": "complete() || null",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-invalid]": "invalidInput() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null",
        "[class]": "classes()",
        "(focusout)": "onFocusOut($event)"
    }
})
export class MaskedTextBoxComponent implements MaskedTextBoxVariantInput, FormValueControl<string> {
    readonly #announcer = injectLiveAnnouncer();
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #label = injectLabelAssociation({
        ariaDescribedBy: () => this.ariaDescribedBy(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy(),
        focus: () => this.focus()
    });
    readonly #mask = computed(() => parseMask(this.mask(), this.rules()));
    readonly #prompt = computed(() => Array.from(this.prompt())[0] ?? " ");
    readonly #redoStack: MaskSnapshot[] = [];
    // NgModel writes null before its first value, and so does a reset form control.
    readonly #slots = computed(() =>
        slotsFromValue(this.#mask(), (this.value() as string | null) ?? "", this.includeLiterals())
    );
    readonly #undoStack: MaskSnapshot[] = [];
    #composing = false;
    /** The value the box last wrote, which tells a value from outside apart. */
    #ownValue: string | null = null;
    /** Whether the last edit was typing, which undo takes back in one step with the typing before it. */
    #typing = false;

    protected readonly classes = computed(() =>
        twMerge(maskedTextBoxThemeVariants({ rounded: this.rounded(), size: this.size() }), this.userClass())
    );
    protected readonly complete = computed(() => slotsComplete(this.#mask(), this.#slots()));
    protected readonly describedBy = this.#label.describedBy;
    protected readonly display = computed(() => displayMask(this.#mask(), this.#slots(), this.#prompt()));
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly empty = computed(() => this.#slots().every(slot => slot == null));
    protected readonly fieldClass = MASKED_TEXT_BOX_FIELD_CLASSES;
    protected readonly focused = signal(false);
    protected readonly ghostClass = MASKED_TEXT_BOX_GHOST_CLASSES;
    /** How far the input has scrolled its text, which the ghost follows. */
    protected readonly ghostShift = signal(0);
    protected readonly ghostTransform = computed(() => {
        const shift = this.ghostShift();
        return shift === 0 ? null : `translateX(${-shift}px)`;
    });
    /** An empty box shows its placeholder instead of the mask until it has focus. */
    protected readonly ghostVisible = computed(() => !this.empty() || this.focused() || !this.placeholder());
    protected readonly inputClasses = computed(() => twMerge(MASKED_TEXT_BOX_INPUT_CLASSES, this.inputClass()));
    /** A mask of digits only brings up a number keyboard on touch devices. */
    protected readonly inputMode = computed(() => {
        const attribute = this.inputAttributes()["inputmode"];
        if (attribute != null && attribute !== false) {
            return String(attribute);
        }
        const slots = this.#mask().parts.filter((part): part is MaskSlot => !part.literal);
        return slots.length > 0 && slots.every(slot => slot.kind === "digit") ? "numeric" : null;
    });
    protected readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>("input");
    protected readonly invalidInput = computed(
        () =>
            this.touched() &&
            (this.invalid() || (this.required() && this.empty()) || (!this.empty() && !this.complete()))
    );
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly messages = this.#i18n.componentMessages("maskedTextBox", MASKED_TEXT_BOX_DEFAULT_MESSAGES);
    protected readonly prefixTemplateList = contentChildren(MaskedTextBoxPrefixTemplateDirective, {
        read: TemplateRef
    });
    protected readonly showClearButton = computed(
        () => this.clearButton() && !this.effectiveDisabled() && !this.readonly() && !this.empty()
    );
    protected readonly shownPlaceholder = computed(() => (this.ghostVisible() ? null : this.placeholder()));
    protected readonly suffixTemplateList = contentChildren(MaskedTextBoxSuffixTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Id of an element that describes the inner input, such as a hint that gives the format.
     * @default ""
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description Accessible name of the inner input. Prefer a visible label, linked through {@link inputId} or
     * `aria-labelledby`.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Id of the element that labels the inner input.
     * @default ""
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Displays a clear button that empties the value. The button is hidden while the value is empty or the
     * box is disabled or read-only.
     * @default false
     */
    public readonly clearButton = input(false, { transform: booleanAttribute });

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Whether the value includes the mask's literals: `(555) 123-4567` instead of `5551234567`.
     * @default false
     */
    public readonly includeLiterals = input(false, { transform: booleanAttribute });

    /**
     * @description Additional HTML attributes applied directly to the inner `<input>` element, such as `autocomplete`.
     * An `inputmode` here replaces the one the mask picks.
     * @default {}
     */
    public readonly inputAttributes = input<AttributeConfig>({});

    /**
     * @description Emitted when the inner input loses focus, including when focus moves to the clear button or to
     * content in the prefix or suffix templates.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Additional CSS classes applied to the inner `<input>` element.
     * @default ""
     */
    public readonly inputClass = input<string | string[]>("");

    /**
     * @description Emitted when the inner input gains focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Id of the inner `<input>` element. Point a `<label for>` or `<mona-label for>` at it to label the
     * box. A unique id is generated when it isn't set.
     * @default generated
     */
    public readonly inputId = input(createElementControlId());

    /**
     * @description Inline styles applied to the inner `<input>` element. Accepts a style string or a
     * `CSSStyleDeclaration` partial.
     * @default null
     */
    public readonly inputStyle = input<string | Partial<CSSStyleDeclaration> | null>(null);

    /**
     * @description Marks the box as invalid. When bound to a signal form field via `[formField]`, this is written by
     * the `FormField` directive. Once touched, the box also shows as invalid while it's partly filled.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description The format, one character per slot or literal. `0` is a digit, `9` an optional digit, `#` an
     * optional digit, `+` or `-`, `L` a letter, `?` an optional letter, `A` a letter or digit, `a` an optional letter or
     * digit, `&` any character but a space, and `C` an optional one. Anything else is a literal, and so is a character
     * after a backslash, such as `\0`.
     * @default ""
     */
    public readonly mask = input("");

    /**
     * @description Name of the inner input, used by browsers and password managers for autofill. When bound to a
     * signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default ""
     */
    public readonly name = input("");

    /**
     * @description Text shown while the box is empty and doesn't have focus, in place of the mask.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description The character shown in an empty slot.
     * @default "_"
     */
    public readonly prompt = input("_");

    /**
     * @description Prevents value changes while preserving the component's visual state.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the box as required. Triggers the invalid state when the value is empty and the field has
     * been touched.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Border-radius preset applied to the component.
     * @default "medium"
     */
    public readonly rounded = input<MaskedTextBoxVariantProps["rounded"]>("medium");

    /**
     * @description Mask characters of your own, each mapped to a pattern one character must match, such as
     * `{ H: /[0-9a-f]/i }`. They can replace the built-in ones, and their slots are required.
     * @default {}
     */
    public readonly rules = input<MaskRules>({});

    /**
     * @description Size preset controlling the component's dimensions.
     * @default "medium"
     */
    public readonly size = input<MaskedTextBoxVariantProps["size"]>("medium");

    /**
     * @description Emitted when focus leaves the box, including its clear button and prefix and suffix content. Form
     * directives (`[formField]`, `ngModel`, `formControl`) listen to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the box. When bound to a signal form field via `[formField]`, this is
     * written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable value: the characters typed into the slots, up to the last one filled, with a space
     * for an empty slot before it. {@link includeLiterals} adds the mask's literals. A value that doesn't line up with
     * the mask, such as `555-123-4567` for `(000) 000-0000`, is fitted into it and written back as it reads.
     * @default ""
     */
    public readonly value = model("");

    public constructor() {
        afterNextRender({ read: () => this.#warnIfNoMask() });
        effect(() => {
            const value = (this.value() as string | null) ?? "";
            const normalized = valueFromSlots(this.#mask(), this.#slots(), this.includeLiterals());
            untracked(() => {
                // A value set from outside starts a new history, as it would for a native input.
                if (value !== this.#ownValue) {
                    this.#undoStack.length = 0;
                    this.#redoStack.length = 0;
                    this.#typing = false;
                }
                if (normalized !== value) {
                    this.#setValue(normalized);
                }
            });
        });
    }

    /**
     * Focuses the inner input and puts the caret at the first empty slot, where typing picks up.
     * @param options Options passed to the native `focus()` call, such as `preventScroll`.
     */
    public focus(options?: FocusOptions): void {
        const input = this.inputRef().nativeElement;
        input.focus(options);
        const display = this.display();
        const firstEmpty = this.#slots().findIndex(slot => slot == null);
        const part = firstEmpty < 0 ? display.textParts : this.#mask().slotParts[firstEmpty];
        const caret = Math.min(display.offsets[part] ?? display.text.length, display.text.length);
        input.setSelectionRange(caret, caret);
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    protected onBeforeInput(event: InputEvent): void {
        if (event.isComposing || event.inputType.includes("Composition")) {
            return;
        }
        if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
            event.preventDefault();
            this.#travel(event.inputType === "historyUndo" ? this.#undoStack : this.#redoStack);
            return;
        }
        const kind = EDIT_KINDS[event.inputType];
        if (kind === undefined) {
            return;
        }
        event.preventDefault();
        const text = kind === "insert" ? (event.data ?? event.dataTransfer?.getData("text/plain") ?? "") : "";
        this.#edit(kind, text, event.inputType === "insertText");
    }

    protected onBlur(event: FocusEvent): void {
        this.focused.set(false);
        this.inputBlur.emit(event);
    }

    protected onClearClick(): void {
        this.#apply(emptySlots(this.#mask()), 0, false);
        this.inputRef().nativeElement.focus();
    }

    protected onCompositionEnd(): void {
        this.#composing = false;
        this.#fitNativeChange();
    }

    protected onCompositionStart(): void {
        this.#composing = true;
    }

    protected onCut(event: ClipboardEvent): void {
        const input = this.inputRef().nativeElement;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        if (start === end || this.effectiveDisabled() || this.readonly()) {
            return;
        }
        // Cut copies the selection as it shows, then empties its slots. Nothing after it moves up.
        event.preventDefault();
        event.clipboardData?.setData("text/plain", input.value.slice(start, end));
        this.#edit("deleteBackward", "", false);
    }

    protected onFocus(event: FocusEvent): void {
        this.focused.set(true);
        this.inputFocus.emit(event);
    }

    protected onFocusOut(event: FocusEvent): void {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && this.#hostElementRef.nativeElement.contains(nextTarget)) {
            return;
        }
        this.touch.emit();
    }

    protected onInput(event: Event): void {
        if (this.#composing || (event instanceof InputEvent && event.isComposing)) {
            return;
        }
        this.#fitNativeChange();
    }

    protected onKeydown(event: KeyboardEvent): void {
        // A key that moves the caret, rather than typing, ends a run of typing.
        if (event.key.length > 1) {
            this.#typing = false;
        }
        if (!(event.ctrlKey || event.metaKey) || event.altKey) {
            return;
        }
        const key = event.key.toLowerCase();
        // The browser's own undo would go back to text the box replaced, so the box keeps a history of its own.
        if (key === "z" && !event.shiftKey) {
            event.preventDefault();
            this.#travel(this.#undoStack);
        } else if ((key === "z" && event.shiftKey) || (key === "y" && event.ctrlKey && !event.metaKey)) {
            event.preventDefault();
            this.#travel(this.#redoStack);
        }
    }

    protected onPaste(event: ClipboardEvent): void {
        const text = event.clipboardData?.getData("text") ?? "";
        if (!text || this.effectiveDisabled() || this.readonly()) {
            return;
        }
        event.preventDefault();
        this.#edit("insert", text, false);
    }

    protected onPointerDown(): void {
        this.#typing = false;
    }

    protected onScroll(): void {
        this.ghostShift.set(this.inputRef().nativeElement.scrollLeft);
    }

    #announceRejection(slot: MaskSlot): void {
        const messages = this.messages();
        const message = {
            any: messages.characterNotAllowed,
            custom: messages.characterNotAllowed,
            digit: messages.digitOnly,
            digitOrSign: messages.digitOrSignOnly,
            letter: messages.letterOnly,
            letterOrDigit: messages.letterOrDigitOnly
        }[slot.kind];
        void this.#announcer.announce(message, "polite");
    }

    /** Applies an edit's result, as one undo step unless it continues a run of typing. */
    #apply(slots: MaskSlots, caret: number, typing: boolean): void {
        const current = this.#slots();
        const changed = slots.some((slot, index) => slot !== current[index]);
        if (changed && !(typing && this.#typing)) {
            this.#undoStack.push({ caret: this.#caretPart(), slots: current });
            if (this.#undoStack.length > HISTORY_LIMIT) {
                this.#undoStack.shift();
            }
            this.#redoStack.length = 0;
        }
        if (changed) {
            this.#typing = typing;
        }
        this.#write(slots, caret);
    }

    #caretPart(): number {
        const input = this.inputRef().nativeElement;
        return partAt(this.display(), input.selectionStart ?? input.value.length);
    }

    #edit(kind: MaskEditKind, text: string, typed: boolean): void {
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }
        const input = this.inputRef().nativeElement;
        const display = this.display();
        const start = partAt(display, input.selectionStart ?? display.text.length);
        const end = partAt(display, input.selectionEnd ?? display.text.length);
        const result = editMask(this.#mask(), this.#slots(), start, end, kind, text);
        if (result.rejected) {
            this.#announceRejection(result.rejected);
        }
        this.#apply(result.slots, result.caret, typed);
    }

    /**
     * Fits a change the browser made itself, such as text an input method composed or autofill, into the slots. The
     * text that changed is taken as typed over the part it replaced.
     */
    #fitNativeChange(): void {
        const input = this.inputRef().nativeElement;
        const display = this.display();
        const before = display.text;
        const after = input.value;
        if (before === after) {
            return;
        }
        if (this.effectiveDisabled() || this.readonly()) {
            input.value = before;
            return;
        }
        let prefix = 0;
        while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) {
            prefix++;
        }
        let suffix = 0;
        while (
            suffix < before.length - prefix &&
            suffix < after.length - prefix &&
            before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
        ) {
            suffix++;
        }
        const start = partAt(display, prefix);
        const end = partAt(display, before.length - suffix);
        const inserted = after.slice(prefix, after.length - suffix);
        const result = inserted
            ? editMask(this.#mask(), this.#slots(), start, end, "insert", inserted)
            : editMask(this.#mask(), this.#slots(), start, end, "deleteForward");
        if (result.rejected) {
            this.#announceRejection(result.rejected);
        }
        this.#apply(result.slots, result.caret, false);
    }

    #setValue(value: string): void {
        this.#ownValue = value;
        if (value !== this.value()) {
            this.value.set(value);
        }
    }

    /** Goes back, or forward again, through the history. */
    #travel(from: MaskSnapshot[]): void {
        if (this.effectiveDisabled() || this.readonly()) {
            return;
        }
        const snapshot = from.pop();
        if (snapshot == null) {
            return;
        }
        const to = from === this.#undoStack ? this.#redoStack : this.#undoStack;
        to.push({ caret: this.#caretPart(), slots: this.#slots() });
        this.#typing = false;
        this.#write(snapshot.slots, snapshot.caret);
    }

    #warnIfNoMask(): void {
        if (isDevMode() && this.#mask().slotParts.length === 0) {
            console.warn(
                '[Mona MaskedTextBox] The mask has no slots, so nothing can be typed. Set mask, such as "(000) 000-0000".',
                this.#hostElementRef.nativeElement
            );
        }
    }

    /** Shows the slots in the input, with the caret before the given part, and updates the value. */
    #write(slots: MaskSlots, caret: number): void {
        const display = displayMask(this.#mask(), slots, this.#prompt());
        const input = this.inputRef().nativeElement;
        input.value = display.text;
        const position = Math.min(display.offsets[caret] ?? display.text.length, display.text.length);
        if (input.ownerDocument.activeElement === input) {
            input.setSelectionRange(position, position);
        }
        this.#setValue(valueFromSlots(this.#mask(), slots, this.includeLiterals()));
        this.ghostShift.set(input.scrollLeft);
    }
}
