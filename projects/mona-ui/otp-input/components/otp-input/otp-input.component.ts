import { NgTemplateOutlet } from "@angular/common";
import {
    Component,
    computed,
    contentChild,
    effect,
    ElementRef,
    input,
    model,
    output,
    signal,
    TemplateRef,
    viewChild
} from "@angular/core";
import { type FormValueControl } from "@angular/forms/signals";
import { AttributeBinderDirective, AttributeConfig } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { OtpInputSeparatorTemplateDirective } from "../../directives/otp-input-separator-template.directive";
import { OtpSlotDirective } from "../../directives/otp-slot.directive";
import { OtpInputType } from "../../models/OtpInputType";
import {
    otpInputFieldThemeVariants,
    otpInputHostThemeVariants,
    OtpInputVariantInput,
    OtpInputVariantProps
} from "../../styles/otp-input.styles";
import {
    filterCharacters,
    findAttribute,
    isValidCharacter,
    normalizeGroupLengths,
    normalizeLength,
    patternTransform,
    sanitizeInputAttributes
} from "../../utils/otp-input.utils";

interface OtpSlotViewModel {
    active: boolean;
    displayCharacter: string;
    filled: boolean;
    index: number;
    placeholder: boolean;
    selected: boolean;
}

interface OtpGroupViewModel {
    index: number;
    slots: OtpSlotViewModel[];
}

@Component({
    selector: "mona-otp-input",
    templateUrl: "./otp-input.component.html",
    imports: [NgTemplateOutlet, AttributeBinderDirective, OtpSlotDirective],
    host: {
        dir: "ltr",
        "[attr.dir]": "'ltr'",
        "[attr.data-disabled]": "disabled() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-complete]": "isComplete() || null",
        "[attr.data-focused]": "hasFocus() || null",
        "[class]": "classes()"
    }
})
export class OtpInputComponent implements OtpInputVariantInput, FormValueControl<string> {
    protected readonly activeSlotIndex = computed(() => {
        if (!this.hasFocus()) {
            return -1;
        }
        const totalLen = this.normalizedLength();
        const start = this.logicalSelectionStart();
        const end = this.logicalSelectionEnd();

        if (start === end) {
            if (start < totalLen) {
                return start;
            }
            return Math.max(0, totalLen - 1);
        }
        return Math.min(start, totalLen - 1);
    });
    protected readonly classes = computed(() => {
        const baseClasses = otpInputHostThemeVariants();
        return twMerge(baseClasses, this.userClass());
    });
    protected readonly computedAriaLabel = computed(() => {
        const attrs = this.inputAttributes();
        if (findAttribute(attrs, "aria-labelledby") != null) {
            return null;
        }
        const label = findAttribute(attrs, "aria-label");
        if (label != null) {
            return String(label);
        }
        return this.ariaLabel();
    });
    protected readonly computedAriaLabelledby = computed(() => {
        const attrs = this.inputAttributes();
        const labelledby = findAttribute(attrs, "aria-labelledby");
        return labelledby != null ? String(labelledby) : null;
    });
    protected readonly derivedAutocomplete = computed(() => {
        const attrs = this.inputAttributes();
        const autocomplete = findAttribute(attrs, "autocomplete");
        return autocomplete != null ? String(autocomplete) : "one-time-code";
    });
    protected readonly derivedInputMode = computed(() => {
        const attrs = this.inputAttributes();
        const inputMode = findAttribute(attrs, "inputmode");
        if (inputMode != null) {
            return String(inputMode);
        }
        return this.type() === "number" ? "numeric" : "text";
    });
    protected readonly hasFocus = signal(false);
    protected readonly inputClass = computed(() => otpInputFieldThemeVariants());
    protected readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>("input");
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && this.value().length !== this.normalizedLength()))
    );
    protected readonly isComplete = computed(() => this.value().length === this.normalizedLength());
    protected readonly isComposing = signal(false);
    protected readonly logicalSelectionEnd = computed(() => {
        const maxLogicalPosition = Math.min(this.value().length, this.normalizedLength());
        const start = this.logicalSelectionStart();
        const rawEnd = Math.max(0, Math.min(this.selectionEnd(), maxLogicalPosition));
        return Math.max(start, rawEnd);
    });
    protected readonly logicalSelectionStart = computed(() => {
        const maxLogicalPosition = Math.min(this.value().length, this.normalizedLength());
        return Math.max(0, Math.min(this.selectionStart(), maxLogicalPosition));
    });
    protected readonly nativeInputType = computed(() => (this.type() === "password" ? "password" : "text"));
    protected readonly normalizedLength = computed(() => normalizeLength(this.length()));
    protected readonly sanitizedAttributes = computed(() => sanitizeInputAttributes(this.inputAttributes()));
    protected readonly selectionEnd = signal(0);
    protected readonly selectionStart = signal(0);
    protected readonly separatorTemplate = contentChild(OtpInputSeparatorTemplateDirective, {
        read: TemplateRef
    });
    protected readonly visualGroups = computed(() => {
        const totalLen = this.normalizedLength();
        const groupSizes = normalizeGroupLengths(this.groupLength(), totalLen);
        const val = this.value();
        const activeIndex = this.activeSlotIndex();
        const selStart = this.logicalSelectionStart();
        const selEnd = this.logicalSelectionEnd();
        const focused = this.hasFocus();
        const inputType = this.type();
        const placeholderStr = this.placeholder();
        const placeholderChar = placeholderStr.length > 0 ? placeholderStr.charAt(0) : "";

        const groups: OtpGroupViewModel[] = [];
        let slotCounter = 0;

        for (let gIndex = 0; gIndex < groupSizes.length; gIndex++) {
            const size = groupSizes[gIndex];
            const slots: OtpSlotViewModel[] = [];

            for (let s = 0; s < size; s++) {
                const slotIndex = slotCounter++;
                const filled = slotIndex < val.length;
                const character = filled ? val[slotIndex] : "";
                const isPlaceholder = !filled && placeholderChar.length > 0;

                let displayCharacter = "";
                if (filled) {
                    displayCharacter = inputType === "password" ? "•" : character;
                } else if (isPlaceholder) {
                    displayCharacter = placeholderChar;
                }

                const active = focused && slotIndex === activeIndex;
                const selected = focused && slotIndex >= selStart && slotIndex < selEnd;

                slots.push({
                    active,
                    displayCharacter,
                    filled,
                    index: slotIndex,
                    placeholder: isPlaceholder,
                    selected
                });
            }

            groups.push({
                index: gIndex,
                slots
            });
        }

        return groups;
    });

    /**
     * @description Accessible name for the inner `<input>` element.
     * @default "Verification code"
     */
    public readonly ariaLabel = input("Verification code");

    /**
     * @description Emitted when a user interaction completes the verification code.
     */
    public readonly complete = output<string>();

    /**
     * @description Renders the component with reduced visual emphasis and removes pointer interaction.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly disabled = input(false);

    /**
     * @description Configures slot grouping lengths. Accepts a uniform number or an array of group sizes.
     * @default null
     */
    public readonly groupLength = input<number | number[] | null>(null);

    /**
     * @description Additional HTML attributes applied directly to the inner `<input>` element.
     * @default {}
     */
    public readonly inputAttributes = input<AttributeConfig>({});

    /**
     * @description Emitted when the inner input loses focus.
     */
    public readonly inputBlur = output<FocusEvent>();

    /**
     * @description Emitted when the inner input gains focus.
     */
    public readonly inputFocus = output<FocusEvent>();

    /**
     * @description Marks the OTP input as invalid. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false);

    /**
     * @description Sets the total number of characters accepted by the OTP input and the number of visual slots.
     * @default 4
     */
    public readonly length = input(4);

    /**
     * @description Custom regular expression or list of regular expressions used to validate each candidate character.
     * @default []
     */
    public readonly pattern = input<readonly RegExp[], unknown>([], { transform: patternTransform });

    /**
     * @description Hint character displayed in empty visual slots.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description Prevents value changes while preserving the component's focusability and visual state.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly readonly = input(false);

    /**
     * @description Marks the OTP input as required. Triggers invalid state when touched and incomplete.
     * When bound to a signal form field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly required = input(false);

    /**
     * @description Border-radius preset applied to the OTP slots.
     * @default "medium"
     */
    public readonly rounded = input<OtpInputVariantProps["rounded"]>("medium");

    /**
     * @description Text character or string displayed between visual slot groups.
     * @default ""
     */
    public readonly separator = input("");

    /**
     * @description Additional CSS classes applied to separator elements.
     * @default ""
     */
    public readonly separatorClass = input<string | string[]>("");

    /**
     * @description Size preset controlling the dimensions and font size of the OTP slots.
     * @default "medium"
     */
    public readonly size = input<OtpInputVariantProps["size"]>("medium");

    /**
     * @description Additional CSS classes applied to each visual slot element.
     * @default ""
     */
    public readonly slotClass = input<string | string[]>("");

    /**
     * @description Determines whether visual slots within a group have spacing between them or are joined together.
     * @default true
     */
    public readonly spacing = input(true);

    /**
     * @description Emitted when the OTP input is interacted with — on blur or user value change.
     * The `FormField` directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state of the OTP input. When bound to a signal form field via `[formField]`,
     * this is written by the `FormField` directive.
     * @default false
     */
    public readonly touched = input(false);

    /**
     * @description Sets the type of the OTP input ("text", "number", or "password").
     * @default "text"
     */
    public readonly type = input<OtpInputType>("text");

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Two-way bindable current value of the OTP input.
     * @default ""
     */
    public readonly value = model("");

    public constructor() {
        effect(() => {
            const val = this.value();
            const inputType = this.type();
            const pattern = this.pattern();
            const maxLen = this.normalizedLength();

            const filtered = filterCharacters(val, inputType, pattern, maxLen);
            if (filtered !== val) {
                this.value.set(filtered);
            }
        });
    }

    public blur(): void {
        this.inputRef().nativeElement.blur();
    }

    public focus(options?: FocusOptions): void;
    public focus(index?: number): void;
    public focus(target?: number | FocusOptions): void {
        if (this.disabled()) {
            return;
        }
        const el = this.inputRef().nativeElement;
        if (typeof target === "object" && target !== null) {
            el.focus(target);
            this.syncSelection();
            return;
        }
        el.focus();
        const val = this.value();
        const maxLen = this.normalizedLength();

        if (typeof target === "number") {
            const clamped = Math.max(0, Math.min(target, maxLen));
            if (clamped < val.length) {
                el.setSelectionRange(clamped, clamped + 1);
            } else {
                const pos = Math.min(clamped, val.length);
                el.setSelectionRange(pos, pos);
            }
        } else {
            if (val.length < maxLen) {
                el.setSelectionRange(val.length, val.length);
            } else {
                el.setSelectionRange(maxLen, maxLen);
            }
        }
        this.syncSelection();
    }

    protected onBeforeInput(event: InputEvent): void {
        if (this.disabled() || this.readonly() || this.isComposing()) {
            return;
        }
        const inputType = event.inputType;
        const inputEl = this.inputRef().nativeElement;
        const start = inputEl.selectionStart ?? 0;
        const end = inputEl.selectionEnd ?? 0;
        const val = this.value();
        const maxLen = this.normalizedLength();

        if (inputType === "insertText") {
            if (!event.data) {
                return;
            }
            if (event.data.length === 1) {
                if (!isValidCharacter(event.data, this.type(), this.pattern())) {
                    event.preventDefault();
                    return;
                }

                if (start >= maxLen && start === end) {
                    event.preventDefault();
                    return;
                }

                if (start === end && start < val.length) {
                    inputEl.setSelectionRange(start, start + 1);
                }
            } else {
                event.preventDefault();
                this.applyUserInsertion(event.data, start, end);
            }
        } else if (inputType === "insertReplacementText" || inputType === "insertFromPaste") {
            if (event.data) {
                event.preventDefault();
                this.applyUserInsertion(event.data, start, end);
            }
        }
    }

    protected onBlur(event: FocusEvent): void {
        this.hasFocus.set(false);
        this.inputBlur.emit(event);
        this.touch.emit();
    }

    protected onCompositionEnd(event: CompositionEvent): void {
        this.isComposing.set(false);
        this.onInput(event);
    }

    protected onCompositionStart(): void {
        this.isComposing.set(true);
    }

    protected onFocus(event: FocusEvent): void {
        this.hasFocus.set(true);
        this.syncSelection();
        this.inputFocus.emit(event);
    }

    protected onInput(_event?: Event): void {
        if (this.disabled() || this.readonly()) {
            const inputEl = this.inputRef().nativeElement;
            inputEl.value = this.value();
            return;
        }
        if (this.isComposing()) {
            return;
        }
        const inputEl = this.inputRef().nativeElement;
        const rawVal = inputEl.value;
        const prevVal = this.value();
        const nextVal = filterCharacters(rawVal, this.type(), this.pattern(), this.normalizedLength());

        inputEl.value = nextVal;
        const wasIncomplete = prevVal.length < this.normalizedLength();
        this.value.set(nextVal);
        this.touch.emit();

        if (wasIncomplete && nextVal.length === this.normalizedLength()) {
            this.complete.emit(nextVal);
        }
        this.syncSelection();
    }

    protected onKeyDown(event: KeyboardEvent): void {
        if (this.disabled() || this.readonly() || this.isComposing() || event.isComposing) {
            return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }
        if (event.key.length !== 1) {
            return;
        }

        const inputEl = this.inputRef().nativeElement;
        const start = inputEl.selectionStart ?? 0;
        const end = inputEl.selectionEnd ?? 0;
        const val = this.value();
        const maxLen = this.normalizedLength();

        if (!isValidCharacter(event.key, this.type(), this.pattern())) {
            event.preventDefault();
            return;
        }

        if (start >= maxLen && start === end) {
            event.preventDefault();
            return;
        }

        if (start === end && start < val.length) {
            inputEl.setSelectionRange(start, start + 1);
        }
    }

    protected onKeyUp(): void {
        this.syncSelection();
    }

    protected onPaste(event: ClipboardEvent): void {
        if (this.disabled() || this.readonly()) {
            event.preventDefault();
            return;
        }
        const pastedText = event.clipboardData?.getData("text") ?? "";
        if (!pastedText) {
            return;
        }
        event.preventDefault();

        const inputEl = this.inputRef().nativeElement;
        const currentVal = this.value();
        const selStart = inputEl.selectionStart ?? currentVal.length;
        const selEnd = inputEl.selectionEnd ?? selStart;

        this.applyUserInsertion(pastedText, selStart, selEnd);
    }

    protected onSelect(): void {
        this.syncSelection();
    }

    protected onSlotPointerDown(event: PointerEvent, index: number): void {
        if (this.disabled()) {
            return;
        }
        event.preventDefault();
        const el = this.inputRef().nativeElement;
        el.focus();
        const val = this.value();
        if (index < val.length) {
            el.setSelectionRange(index, index + 1);
            this.selectionStart.set(index);
            this.selectionEnd.set(index + 1);
        } else {
            const pos = Math.min(index, val.length);
            el.setSelectionRange(pos, pos);
            this.selectionStart.set(pos);
            this.selectionEnd.set(pos);
        }
    }

    private applyUserInsertion(text: string, selectionStart: number, selectionEnd: number): void {
        if (this.disabled() || this.readonly()) {
            return;
        }
        const inputEl = this.inputRef().nativeElement;
        const currentVal = this.value();
        const maxLen = this.normalizedLength();

        const filtered = filterCharacters(text, this.type(), this.pattern(), Number.MAX_SAFE_INTEGER);
        if (filtered.length === 0 && selectionStart === selectionEnd) {
            return;
        }

        const start = Math.max(0, Math.min(selectionStart, currentVal.length));
        const end = Math.max(start, Math.min(selectionEnd, currentVal.length));

        const before = currentVal.substring(0, start);
        const after = currentVal.substring(end);
        let combined = before + filtered + after;
        if (combined.length > maxLen) {
            combined = combined.substring(0, maxLen);
        }

        const newCaretPos = Math.min(start + filtered.length, maxLen);
        const wasIncomplete = currentVal.length < maxLen;

        inputEl.value = combined;
        this.value.set(combined);
        inputEl.setSelectionRange(newCaretPos, newCaretPos);
        this.selectionStart.set(newCaretPos);
        this.selectionEnd.set(newCaretPos);
        this.touch.emit();

        if (wasIncomplete && combined.length === maxLen) {
            this.complete.emit(combined);
        }
    }

    private syncSelection(): void {
        const el = this.inputRef().nativeElement;
        this.selectionStart.set(el.selectionStart ?? 0);
        this.selectionEnd.set(el.selectionEnd ?? 0);
    }
}
