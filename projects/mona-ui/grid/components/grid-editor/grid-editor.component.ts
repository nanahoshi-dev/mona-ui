import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    input,
    isDevMode,
    output,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { type FieldTree, FormField } from "@angular/forms/signals";
import { LucideOctagonAlert } from "@lucide/angular";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { MonaI18nService, parseLocalizedNumber } from "@nanahoshi/mona-ui/i18n";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { TooltipComponent } from "@nanahoshi/mona-ui/tooltip";
import { v4 } from "uuid";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { Column } from "../../models/Column";
import type { GridEditSession } from "../../models/GridEditSession";
import type { GridEditTemplateContext } from "../../models/GridEditTemplateContext";
import { GridService } from "../../services/grid.service";
import { gridCellEditorBaseThemeVariants, gridCellEditorInputThemeVariants } from "../../styles/grid.styles";

const FOCUSABLE_TARGET_SELECTOR = "button, input, select, textarea, a[href], [tabindex]";
/** The controls Tab moves between in an edited row: each editor's first control and the row's command buttons. */
const ROW_EDITOR_SELECTOR = "mona-grid-editor, mona-grid-command-cell";
/** A number written the way JavaScript writes it, such as data from a server: `1234.5`, `-2e3`. */
const MACHINE_NUMBER_PATTERN = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

/** What ended an edit: Enter (or `commit()` in a template) or focus leaving the editor. */
export type GridEditorCommitTrigger = "blur" | "enter";

@Component({
    selector: "mona-grid-editor",
    templateUrl: "./grid-editor.component.html",
    imports: [
        CheckBoxComponent,
        DatePickerComponent,
        FormField,
        LucideOctagonAlert,
        NgTemplateOutlet,
        NumericTextBoxComponent,
        TextBoxComponent,
        TooltipComponent
    ],
    host: {
        "[class]": "baseClass()",
        "(keydown)": "onHostKeydown($event)"
    }
})
export class GridEditorComponent {
    readonly #datePopupOpen = signal(false);
    readonly #elementRef = inject(ElementRef<HTMLElement>);
    readonly #gridService = inject(GridService, { optional: true });
    readonly #i18n = inject(MonaI18nService, { optional: true });
    readonly #logicalCell = inject(GridLogicalCellDirective, { optional: true });
    /** Tab and Enter work on the whole row: in row edit mode and in the add row. */
    readonly #rowEditing = computed(() => this.isNew() || this.#gridService?.editContext()?.mode === "row");
    #ignoreNextBooleanFocusOut = false;
    /** The date before the last change, whose time of day a picked day keeps. */
    #lastDateValue: Date | null = null;
    private readonly numericTextBoxRef = viewChild(NumericTextBoxComponent);
    private readonly textBoxRef = viewChild(TextBoxComponent);
    protected readonly baseClass = computed(() => {
        return gridCellEditorBaseThemeVariants({ virtual: this.#gridService?.virtualScrollOptions().enabled ?? false });
    });
    protected readonly editTemplateContext = computed<GridEditTemplateContext | null>(() => {
        const field = this.formField();
        if (field == null) {
            return null;
        }
        return {
            cancel: (): void => this.cancelEdit.emit(),
            column: this.column().field,
            commit: (): void => this.commit.emit("enter"),
            dataField: this.column().field,
            dataItem: this.session().model(),
            errors: field().errors(),
            field,
            form: this.session().form,
            invalid: field().invalid(),
            isNew: this.isNew(),
            session: this.session(),
            setValue: (value: unknown): void => field().value.set(value),
            touched: field().touched(),
            value: field().value()
        };
    });
    protected readonly editorInputClass = computed(() => {
        return gridCellEditorInputThemeVariants({
            virtual: this.#gridService?.virtualScrollOptions().enabled ?? false
        });
    });
    /** The editor's accessible name: the column title, as the header that would name it is in another table. */
    protected readonly editorLabel = computed(() => this.column().title || this.column().field);
    protected readonly errorDescribedBy = computed(() => (this.hasFieldError() ? this.errorId : ""));
    protected readonly errorId = `mona-grid-editor-error-${v4()}`;
    protected readonly fieldErrorMessage = computed(() => {
        const [firstError] = this.formField()?.().errors() ?? [];
        return firstError?.message ?? this.#gridService?.messages().fieldValidationError ?? "";
    });
    /** The column's form field; null when the session has none, as for a value a signal form can't hold. */
    protected readonly formField = computed<FieldTree<unknown> | null>(
        () => (this.session().form[this.column().field] as FieldTree<unknown> | undefined) ?? null
    );
    protected readonly hasFieldError = computed(() => {
        const field = this.formField()?.();
        return field != null && field.invalid() && field.touched();
    });
    protected readonly readOnlyValue = computed(() => this.session().model()[this.column().field]);

    /**
     * @description Controls whether the editor focuses its input after it renders.
     */
    public readonly autoFocus = input(true);
    public readonly cancelEdit = output<void>();
    public readonly column = input.required<Column>();
    public readonly commit = output<GridEditorCommitTrigger>();
    public readonly isNew = input(false);
    public readonly session = input.required<GridEditSession>();

    public readonly tabNavigate = output<"next" | "previous">();

    /**
     * @description Enables Tab and Shift+Tab traversal between editable cells while cell editing.
     */
    public readonly tabNavigationEnabled = input(false);

    public constructor() {
        effect(() => {
            if (this.formField() == null && isDevMode()) {
                console.warn(
                    `mona-grid: column '${this.column().field}' has no form field in the edit session, so it is ` +
                        "shown read-only. Give the row a value for the field, or set the column's editable to false."
                );
            }
        });
        effect(() => {
            if (this.column().dataType !== "number") {
                return;
            }
            const field = this.formField();
            if (field == null) {
                return;
            }
            const value = field().value();
            const coercedValue = this.#coerceNumberValue(value);
            if (Object.is(value, coercedValue)) {
                return;
            }
            untracked(() => field().value.set(coercedValue));
        });
        effect(() => {
            if (this.column().dataType !== "date") {
                return;
            }
            const field = this.formField();
            if (field == null) {
                return;
            }
            const value = field().value();
            untracked(() => this.#keepTimeOfDay(field, value));
        });
        afterNextRender({
            read: () => this.#focusEditor()
        });
    }

    protected onBooleanEditorClick(): void {
        this.#focusBooleanInput();
    }

    protected onBooleanEditorFocusOut(event: FocusEvent): void {
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        const editorHost = event.currentTarget as HTMLElement;
        if (relatedTarget && editorHost.contains(relatedTarget)) {
            return;
        }
        if (this.#ignoreNextBooleanFocusOut) {
            return;
        }
        this.commit.emit("blur");
    }

    protected onBooleanEditorPointerDown(): void {
        this.#ignoreNextBooleanFocusOut = true;
        setTimeout(() => {
            this.#ignoreNextBooleanFocusOut = false;
        });
    }

    protected onDatePickerClose(): void {
        this.#datePopupOpen.set(false);
    }

    protected onDatePickerOpen(): void {
        this.#datePopupOpen.set(true);
    }

    /** Enter commits and Escape cancels, except while an IME composes or the date popup is open. */
    protected onEditorKeydown(event: KeyboardEvent): void {
        if (event.isComposing || event.keyCode === 229 || this.#datePopupOpen()) {
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            this.commit.emit("enter");
        } else if (event.key === "Escape" && !event.defaultPrevented) {
            event.preventDefault();
            this.cancelEdit.emit();
        }
    }

    protected onHostKeydown(event: KeyboardEvent): void {
        if (event.key !== "Tab" || event.defaultPrevented || event.isComposing) {
            return;
        }
        if (this.tabNavigationEnabled()) {
            event.preventDefault();
            event.stopPropagation();
            this.tabNavigate.emit(event.shiftKey ? "previous" : "next");
            return;
        }
        if (!this.#rowEditing()) {
            return;
        }
        // Tab moves between the row's editors and commands; past either end it leaves the grid.
        event.preventDefault();
        event.stopPropagation();
        if (!this.#focusSiblingControl(event.shiftKey)) {
            this.#logicalCell?.leaveGrid(event.shiftKey);
        }
    }

    #coerceNumberValue(value: unknown): number | null {
        if (typeof value === "number") {
            return Number.isFinite(value) ? value : null;
        }
        if (typeof value !== "string") {
            return null;
        }
        const text = value.trim();
        if (text === "") {
            return null;
        }
        if (MACHINE_NUMBER_PATTERN.test(text)) {
            const numberValue = Number(text);
            return Number.isFinite(numberValue) ? numberValue : null;
        }
        // Text as a person writes it in the grid's locale: "1.234,5" in de-DE.
        return parseLocalizedNumber(text, this.#i18n?.localeId() ?? "en-US");
    }

    #focusBooleanInput(): void {
        const checkbox = this.#elementRef.nativeElement.querySelector(
            'input[type="checkbox"]'
        ) as HTMLInputElement | null;
        checkbox?.focus();
    }

    #focusEditor(): void {
        if (!this.autoFocus()) {
            return;
        }
        if (this.column().editTemplate) {
            this.#focusTemplateTarget();
            return;
        }
        this.textBoxRef()?.focus();
        this.numericTextBoxRef()?.focus();
        const type = this.column().dataType;
        if (type === "date") {
            const inputElement = this.#elementRef.nativeElement.querySelector("input") as HTMLInputElement | null;
            inputElement?.focus();
        }
        if (type === "boolean") {
            this.#focusBooleanInput();
        }
    }

    /** Focuses the next or previous editor or command button in the row; false at either end. */
    #focusSiblingControl(backwards: boolean): boolean {
        const host = this.#elementRef.nativeElement as HTMLElement;
        const row = host.closest("tr");
        if (row == null) {
            return false;
        }
        const controls: HTMLElement[] = [];
        let current = -1;
        for (const container of Array.from(row.querySelectorAll<HTMLElement>(ROW_EDITOR_SELECTOR))) {
            const targets = this.#focusTargets(container);
            if (container === host) {
                current = controls.length;
            }
            // An editor is one stop; the command cell's buttons are one each.
            controls.push(...(container.localName === "mona-grid-editor" ? targets.slice(0, 1) : targets));
        }
        if (current < 0) {
            return false;
        }
        const target = controls[backwards ? current - 1 : current + 1];
        if (target == null) {
            return false;
        }
        target.focus();
        return true;
    }

    #focusTargets(container: HTMLElement): HTMLElement[] {
        return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_TARGET_SELECTOR)).filter(
            candidate =>
                !candidate.hasAttribute("disabled") &&
                candidate.getAttribute("aria-hidden") !== "true" &&
                candidate.closest("[aria-hidden='true'], [hidden], [inert]") == null
        );
    }

    #focusTemplateTarget(): void {
        this.#focusTargets(this.#elementRef.nativeElement)[0]?.focus();
    }

    /**
     * Keeps the time of day when a new day is picked: the date picker gives midnight, which would drop the time a
     * value had.
     */
    #keepTimeOfDay(field: FieldTree<unknown>, value: unknown): void {
        const previous = this.#lastDateValue;
        this.#lastDateValue = value instanceof Date ? value : null;
        if (!(value instanceof Date) || previous == null || value === previous || Number.isNaN(value.getTime())) {
            return;
        }
        const midnight = (date: Date): boolean =>
            date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
        if (!midnight(value) || midnight(previous)) {
            return;
        }
        const withTime = new Date(value);
        withTime.setHours(
            previous.getHours(),
            previous.getMinutes(),
            previous.getSeconds(),
            previous.getMilliseconds()
        );
        this.#lastDateValue = withTime;
        field().value.set(withTime);
    }
}
