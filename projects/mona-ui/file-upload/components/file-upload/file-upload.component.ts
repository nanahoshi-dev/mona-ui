import { DOCUMENT } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    numberAttribute,
    output,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import {
    LucideCircleAlert,
    LucideCircleCheck,
    LucideCloudUpload,
    LucideFile,
    LucideRotateCw,
    LucideX
} from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { formatNumber, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import {
    createElementControlId,
    injectEffectiveDisabled,
    injectLabelAssociation,
    runUpload
} from "@nanahoshi/mona-ui/internal";
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
import { twMerge } from "tailwind-merge";
import { FILE_UPLOAD_DEFAULT_MESSAGES } from "../../i18n/file-upload.default-messages";
import type { FileUploadHandler } from "../../models/FileUploadHandler";
import type { FileUploadItem } from "../../models/FileUploadItem";
import type { FileUploadRejection } from "../../models/FileUploadRejection";
import type { FileUploadStatus } from "../../models/FileUploadStatus";
import {
    fileUploadActionsThemeVariants,
    fileUploadBrowseThemeVariants,
    fileUploadItemActionsThemeVariants,
    fileUploadItemBodyThemeVariants,
    fileUploadItemIconThemeVariants,
    fileUploadItemNameThemeVariants,
    fileUploadItemProgressThemeVariants,
    fileUploadItemStatusThemeVariants,
    fileUploadItemThemeVariants,
    fileUploadListThemeVariants,
    fileUploadRestrictionsThemeVariants,
    fileUploadThemeVariants,
    fileUploadZoneIconThemeVariants,
    fileUploadZoneTextThemeVariants,
    fileUploadZoneThemeVariants
} from "../../styles/file-upload.styles";
import {
    checkFile,
    describeAccept,
    type FileUploadRules,
    formatFileSize,
    isSameFile,
    isSameFileList,
    parseAccept
} from "../../utils/file-upload.utils";

/** How long the status region stays empty before it repeats the message it already holds. */
const ANNOUNCEMENT_REPEAT_DELAY = 100;

/** A row of the list: the item it shows, and how to stop its upload while one runs. */
interface FileUploadEntry {
    /** Stops the running upload without reporting it. */
    readonly abort: (() => void) | null;
    readonly item: FileUploadItem;
    /** Stable across updates, for tracking the row and the ids inside it. */
    readonly key: number;
}

/** What a row of the template shows. */
interface FileUploadRow {
    readonly actionsShown: boolean;
    readonly icon: "error" | "file" | "uploaded";
    readonly item: FileUploadItem;
    readonly key: number;
    readonly nameId: string;
    readonly progressLabel: string;
    readonly progressValue: number | null;
    /** Name of the button that removes the file, or cancels its upload while it runs. */
    readonly removeLabel: string;
    readonly retryLabel: string;
    readonly status: string;
    readonly statusError: boolean;
    readonly statusId: string;
}

/**
 * Picks files from a drop zone or the browser's file dialog, checks their type, size and count, and lists them. Given
 * an `upload` function, it uploads each file with a progress bar, and lets the person cancel or retry an upload.
 *
 * The value is the files the checks let through. With an `upload` function, it's the files that finished uploading,
 * so a required field stays invalid until one has.
 */
@Component({
    selector: "mona-file-upload",
    templateUrl: "./file-upload.component.html",
    exportAs: "monaFileUpload",
    imports: [
        ButtonDirective,
        LucideCircleAlert,
        LucideCircleCheck,
        LucideCloudUpload,
        LucideFile,
        LucideRotateCw,
        LucideX,
        ProgressBarComponent
    ],
    host: {
        // The group takes the label's name; the hint and errors describe the browse button, so the host drops the
        // static attributes it was given.
        role: "group",
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "ariaLabel() || null",
        "[attr.aria-labelledby]": "labelledBy()",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[class]": "classes()",
        "(focusout)": "onFocusOut($event)"
    }
})
export class FileUploadComponent implements FormValueControl<File[]> {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #entries = signal<readonly FileUploadEntry[]>([]);
    readonly #hostElementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #label = injectLabelAssociation({
        // A click on a label's caption focuses the browse button rather than opening the dialog unasked.
        activate: () => this.focus(),
        ariaDescribedBy: () => this.ariaDescribedBy(),
        ariaLabel: () => this.ariaLabel(),
        ariaLabelledBy: () => this.ariaLabelledBy(),
        focus: () => this.focus()
    });
    readonly #maxFiles = computed(() => {
        const maxFiles = this.maxFiles();
        return maxFiles != null && Number.isFinite(maxFiles) && maxFiles >= 1 ? Math.floor(maxFiles) : null;
    });
    readonly #rules = computed<FileUploadRules>(() => ({
        accept: parseAccept(this.accept()),
        maxFileSize: this.#positiveOrNull(this.maxFileSize()),
        minFileSize: this.#positiveOrNull(this.minFileSize())
    }));
    #announcementTimer: ReturnType<typeof setTimeout> | undefined = undefined;
    /** Drag events over the zone and its children, so leaving a child for its parent doesn't end the drag. */
    #dragDepth = 0;
    #nextKey = 0;
    /** The value as last written here, to tell a value set from outside from one this component wrote. */
    #writtenValue: readonly File[] | null = null;

    protected readonly actionsClass = fileUploadActionsThemeVariants();
    /** What the status region says: the last files added or rejected, upload finished or failed, or file removed. */
    protected readonly announcement = signal("");
    protected readonly browseButtonRef = viewChild.required<ElementRef<HTMLButtonElement>>("browseButton");
    protected readonly browseClass = fileUploadBrowseThemeVariants();
    protected readonly browseDescribedBy = computed(() => {
        const ids = [this.restrictions() ? this.restrictionsId : null, this.#label.describedBy()];
        return ids.filter(id => !!id).join(" ") || null;
    });
    protected readonly classes = computed(() => twMerge(fileUploadThemeVariants(), this.userClass()));
    protected readonly dragging = signal(false);
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly fileInputRef = viewChild.required<ElementRef<HTMLInputElement>>("fileInput");
    protected readonly interactive = computed(() => !this.effectiveDisabled() && !this.readonly());
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && (this.value() ?? []).length === 0))
    );
    protected readonly itemActionsClass = fileUploadItemActionsThemeVariants();
    protected readonly itemBodyClass = fileUploadItemBodyThemeVariants();
    protected readonly itemClass = fileUploadItemThemeVariants();
    protected readonly itemIconClass = {
        error: fileUploadItemIconThemeVariants({ tone: "error" }),
        file: fileUploadItemIconThemeVariants({ tone: "muted" }),
        uploaded: fileUploadItemIconThemeVariants({ tone: "success" })
    } as const;
    protected readonly itemNameClass = fileUploadItemNameThemeVariants();
    protected readonly itemProgressClass = fileUploadItemProgressThemeVariants();
    protected readonly itemStatusClass = {
        error: fileUploadItemStatusThemeVariants({ tone: "error" }),
        muted: fileUploadItemStatusThemeVariants({ tone: "muted" })
    } as const;
    protected readonly labelledBy = this.#label.labelledBy;
    protected readonly listClass = fileUploadListThemeVariants();
    protected readonly listId = createElementControlId();
    protected readonly messages = this.#i18n.componentMessages("fileUpload", FILE_UPLOAD_DEFAULT_MESSAGES);
    /** Whether the upload and clear buttons show: files wait for them while `autoUpload` is off. */
    protected readonly pendingActionsShown = computed(
        () =>
            this.upload() != null &&
            !this.autoUpload() &&
            this.interactive() &&
            this.#entries().some(entry => entry.item.status === "selected")
    );
    protected readonly restrictions = computed(() => {
        const messages = this.messages();
        const localeId = this.#i18n.localeId();
        const rules = this.#rules();
        const parts: string[] = [];
        if (rules.accept.length > 0) {
            parts.push(messages.fileTypes(describeAccept(rules.accept, localeId)));
        }
        if (rules.maxFileSize != null) {
            parts.push(messages.maxFileSize(formatFileSize(rules.maxFileSize, localeId)));
        }
        const maxFiles = this.#maxFiles();
        if (this.multiple() && maxFiles != null) {
            parts.push(messages.maxFiles(maxFiles));
        }
        return parts.join(" · ");
    });
    protected readonly restrictionsClass = fileUploadRestrictionsThemeVariants();
    protected readonly restrictionsId = createElementControlId();
    protected readonly rows = computed<readonly FileUploadRow[]>(() => {
        const messages = this.messages();
        const localeId = this.#i18n.localeId();
        const waiting = this.upload() != null && !this.autoUpload();
        return this.#entries().map(({ item, key }) => {
            const size = formatFileSize(item.file.size, localeId);
            let status: string;
            switch (item.status) {
                case "failed":
                    status = messages.uploadFailed;
                    break;
                case "rejected":
                    status = this.#rejectionMessage(item.rejection);
                    break;
                case "selected":
                    status = waiting ? `${size} · ${messages.readyToUpload}` : size;
                    break;
                case "uploaded":
                    status = `${size} · ${messages.uploaded}`;
                    break;
                case "uploading":
                    status =
                        item.progress == null
                            ? `${size} · ${messages.uploading}`
                            : `${size} · ${messages.uploading} · ${formatNumber(item.progress, localeId, { style: "percent" })}`;
                    break;
            }
            const error = item.status === "failed" || item.status === "rejected";
            return {
                // Read-only keeps the list as it is, so its buttons go; disabled keeps them, unusable.
                actionsShown: !this.readonly(),
                icon: error ? "error" : item.status === "uploaded" ? "uploaded" : "file",
                item,
                key,
                nameId: `${this.listId}-${key}-name`,
                progressLabel: item.file.name,
                progressValue: item.progress == null ? null : Math.round(item.progress * 100),
                removeLabel:
                    item.status === "uploading" ? messages.cancel(item.file.name) : messages.remove(item.file.name),
                retryLabel: messages.retry(item.file.name),
                status,
                statusError: error,
                statusId: `${this.listId}-${key}-status`
            };
        });
    });
    protected readonly zoneClass = fileUploadZoneThemeVariants();
    protected readonly zoneIconClass = fileUploadZoneIconThemeVariants();
    protected readonly zoneTextClass = fileUploadZoneTextThemeVariants();

    /**
     * @description File types the dialog offers and the checks accept, as in the native `accept` attribute: extensions
     * such as `.pdf`, MIME types such as `image/png`, or `image/*`. Files dropped on the zone are checked against it
     * too, since the dialog's filter doesn't apply to them. Empty accepts every file.
     * @default ""
     */
    public readonly accept = input("");

    /**
     * @description Id of an element that describes the browse button, such as an error message. A form field's hint
     * and errors are added after it.
     * @default null
     */
    public readonly ariaDescribedBy = input<string | null>(null, { alias: "aria-describedby" });

    /**
     * @description Accessible name of the group, when no label names it.
     * @default null
     */
    public readonly ariaLabel = input<string | null>(null, { alias: "aria-label" });

    /**
     * @description Id of the element that names the group.
     * @default null
     */
    public readonly ariaLabelledBy = input<string | null>(null, { alias: "aria-labelledby" });

    /**
     * @description Uploads each file as soon as it's added. When off, files wait for the upload button, or for
     * `uploadFiles()`. Has no effect without an `upload` function.
     * @default true
     */
    public readonly autoUpload = input(true, { transform: booleanAttribute });

    /**
     * @description Turns off the drop zone, the browse button and the list's buttons. When bound to a signal form
     * field via `[formField]`, this is written by the `FormField` directive.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the upload as invalid. When bound to a signal form field via `[formField]`, this is written
     * by the `FormField` directive.
     * @default false
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /** Every file in the list, with where it stands, in the order they were added. */
    public readonly items = computed<readonly FileUploadItem[]>(() => this.#entries().map(entry => entry.item));

    /**
     * @description The largest file size in bytes. Larger files are listed as rejected, and not added.
     * @default null
     */
    public readonly maxFileSize = input<number | null, unknown>(null, { transform: optionalNumberAttribute });

    /**
     * @description The most files the list holds, when `multiple` is on. Files past it are listed as rejected.
     * @default null
     */
    public readonly maxFiles = input<number | null, unknown>(null, { transform: optionalNumberAttribute });

    /**
     * @description The smallest file size in bytes. Smaller files, such as empty ones, are listed as rejected.
     * @default null
     */
    public readonly minFileSize = input<number | null, unknown>(null, { transform: optionalNumberAttribute });

    /**
     * @description Lets the person add several files. When off, a new file replaces the one in the list.
     * @default true
     */
    public readonly multiple = input(true, { transform: booleanAttribute });

    /**
     * @description Keeps the list as it is: files can't be added or removed.
     * @default false
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Emitted when the person removes a file, by its remove or cancel button or by the clear button,
     * with the file as it was. Delete an uploaded file from the server here.
     */
    public readonly remove = output<FileUploadItem>();

    /**
     * @description Marks the upload as required: it's invalid when touched with no file in its value.
     * @default false
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Emitted when focus leaves the component, and when files are dropped on it. The `FormField`
     * directive listens to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state. When bound to a signal form field via `[formField]`, this is written by the
     * `FormField` directive.
     * @default false
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Uploads one file, and returns a promise or an observable, such as HttpClient's request with
     * `reportProgress: true` and `observe: "events"`. Without it, the component only picks files, and the value holds
     * them for the form to send.
     * @default null
     */
    public readonly upload = input<FileUploadHandler | null>(null);

    /**
     * @description Emitted when a file fails to upload, with the error in its `error`.
     */
    public readonly uploadError = output<FileUploadItem>();

    /**
     * @description Emitted when a file finishes uploading, with what the upload returned in its `response`.
     */
    public readonly uploadSuccess = output<FileUploadItem>();

    /** Whether any file is uploading. */
    public readonly uploading = computed(() => this.#entries().some(entry => entry.item.status === "uploading"));

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description The files the checks let through, or with an `upload` function, the files that finished
     * uploading. Setting it from outside replaces the list, and stops the uploads that are running.
     * @default []
     */
    public readonly value = model<File[]>([]);

    public constructor() {
        effect(() => {
            const value = this.value() ?? [];
            untracked(() => this.#adoptValue(value));
        });
        this.#destroyRef.onDestroy(() => {
            clearTimeout(this.#announcementTimer);
            for (const entry of this.#entries()) {
                entry.abort?.();
            }
        });
    }

    /** Opens the browser's file dialog, unless the component is disabled or read-only. */
    public browse(): void {
        if (this.interactive()) {
            this.fileInputRef().nativeElement.click();
        }
    }

    /** Removes every file, stopping the uploads that are running, and emits `remove` for each but the rejected. */
    public clearFiles(): void {
        const entries = this.#entries();
        if (entries.length === 0) {
            return;
        }
        for (const entry of entries) {
            entry.abort?.();
        }
        this.#entries.set([]);
        this.#writeValue();
        for (const entry of entries) {
            if (entry.item.status !== "rejected") {
                this.remove.emit(entry.item);
            }
        }
    }

    /** Moves focus to the browse button. */
    public focus(): void {
        this.browseButtonRef().nativeElement.focus();
    }

    /**
     * @internal
     */
    public setLabelledBy(id: string | null): void {
        this.#label.setLabelledBy(id);
    }

    /** Uploads every file waiting for the upload button. Does nothing without an `upload` function. */
    public uploadFiles(): void {
        if (this.upload() == null) {
            return;
        }
        for (const entry of this.#entries()) {
            if (entry.item.status === "selected") {
                this.#startUpload(entry.key);
            }
        }
    }

    protected onClearClick(): void {
        this.clearFiles();
        this.focus();
    }

    protected onDragEnter(event: DragEvent): void {
        if (!this.#carriesFiles(event)) {
            return;
        }
        // Prevented even when disabled, or the browser would open the dropped file in place of the page.
        event.preventDefault();
        if (!this.interactive()) {
            return;
        }
        this.#dragDepth++;
        this.dragging.set(true);
    }

    protected onDragLeave(event: DragEvent): void {
        if (!this.#carriesFiles(event) || this.#dragDepth === 0) {
            return;
        }
        this.#dragDepth--;
        if (this.#dragDepth === 0) {
            this.dragging.set(false);
        }
    }

    protected onDragOver(event: DragEvent): void {
        if (!this.#carriesFiles(event)) {
            return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = this.interactive() ? "copy" : "none";
        }
    }

    protected onDrop(event: DragEvent): void {
        if (!this.#carriesFiles(event)) {
            return;
        }
        event.preventDefault();
        this.#dragDepth = 0;
        this.dragging.set(false);
        if (!this.interactive()) {
            return;
        }
        this.#addFiles(Array.from(event.dataTransfer?.files ?? []));
        this.touch.emit();
    }

    protected onFileInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        // Cleared, so choosing the same file again still reports a change.
        input.value = "";
        this.#addFiles(files);
    }

    protected onFocusOut(event: FocusEvent): void {
        const next = event.relatedTarget as Node | null;
        if (next != null && this.#hostElementRef.nativeElement.contains(next)) {
            return;
        }
        // The file dialog takes focus from the window, not from the button; that isn't leaving the component.
        if (next == null && !this.#document.hasFocus()) {
            return;
        }
        this.touch.emit();
    }

    protected onRemoveClick(row: FileUploadRow): void {
        this.#removeEntry(row.key);
    }

    protected onRetryClick(row: FileUploadRow): void {
        // The retry button goes once the upload starts, so focus moves to the row's cancel button.
        const hadFocus = this.#rowHasFocus(row.key);
        this.#startUpload(row.key);
        if (hadFocus) {
            afterNextRender(
                () =>
                    this.#hostElementRef.nativeElement
                        .querySelector<HTMLButtonElement>(`[data-file-row="${row.key}"] [data-file-action="remove"]`)
                        ?.focus(),
                { injector: this.#injector }
            );
        }
    }

    protected onUploadClick(): void {
        // The upload and clear buttons go once nothing waits, so focus moves to the browse button.
        this.uploadFiles();
        this.focus();
    }

    protected onZoneClick(event: MouseEvent): void {
        // The browse button opens the dialog itself.
        if (event.target instanceof Element && this.browseButtonRef().nativeElement.contains(event.target)) {
            return;
        }
        // Inside a <label>, the click would also activate the label's first control, the browse button, a second time.
        event.preventDefault();
        this.browse();
    }

    #addFiles(files: readonly File[]): void {
        if (!this.interactive() || files.length === 0) {
            return;
        }
        const rules = this.#rules();
        const multiple = this.multiple();
        const limit = multiple ? (this.#maxFiles() ?? Number.POSITIVE_INFINITY) : 1;
        // Rejected rows only explain the last selection.
        const kept = this.#entries().filter(entry => entry.item.status !== "rejected");
        const added: FileUploadEntry[] = [];
        const rejected: FileUploadEntry[] = [];
        for (const file of files) {
            const known = [...kept, ...added].some(entry => isSameFile(entry.item.file, file));
            if (known && multiple) {
                continue;
            }
            let rejection = checkFile(file, rules);
            const count = (multiple ? kept.length : 0) + added.length;
            if (rejection == null && count >= limit) {
                rejection = "maxFiles";
            }
            if (rejection == null) {
                added.push(this.#createEntry(file, "selected"));
            } else {
                rejected.push(this.#createEntry(file, "rejected", rejection));
            }
        }
        // One file at a time: a new one replaces the one in the list.
        const replaced = !multiple && added.length > 0 ? kept : [];
        for (const entry of replaced) {
            entry.abort?.();
        }
        const remaining = replaced.length > 0 ? [] : kept;
        this.#entries.set([...remaining, ...added, ...rejected]);
        this.#writeValue();
        this.#announceAdded(added, rejected);
        if (this.upload() != null && this.autoUpload()) {
            for (const entry of added) {
                this.#startUpload(entry.key);
            }
        }
    }

    /** Takes in a value set from outside: anything but the value this component wrote replaces the list. */
    #adoptValue(value: readonly File[]): void {
        if (value === this.#writtenValue || isSameFileList(value, this.#valueFiles(this.#entries()))) {
            this.#writtenValue = value;
            return;
        }
        for (const entry of this.#entries()) {
            entry.abort?.();
        }
        const status: FileUploadStatus = this.upload() != null ? "uploaded" : "selected";
        this.#entries.set(value.map(file => this.#createEntry(file, status)));
        this.#writtenValue = value;
    }

    /** Writes a message to the component's own status region. */
    #announce(message: string): void {
        if (!message) {
            return;
        }
        clearTimeout(this.#announcementTimer);
        if (this.announcement() !== message) {
            this.announcement.set(message);
            return;
        }
        // The same text again isn't a change, so the region is emptied first and filled a moment later.
        this.announcement.set("");
        this.#announcementTimer = setTimeout(() => this.announcement.set(message), ANNOUNCEMENT_REPEAT_DELAY);
    }

    #announceAdded(added: readonly FileUploadEntry[], rejected: readonly FileUploadEntry[]): void {
        const messages = this.messages();
        const parts: string[] = [];
        if (added.length > 0) {
            parts.push(messages.filesAdded(added.length));
        }
        for (const entry of rejected) {
            parts.push(messages.fileRejected(entry.item.file.name, this.#rejectionMessage(entry.item.rejection)));
        }
        this.#announce(parts.join(" "));
    }

    #carriesFiles(event: DragEvent): boolean {
        const types = event.dataTransfer?.types;
        return types != null && Array.from(types).includes("Files");
    }

    #createEntry(file: File, status: FileUploadStatus, rejection: FileUploadRejection | null = null): FileUploadEntry {
        return {
            abort: null,
            item: { error: null, file, progress: null, rejection, response: null, status },
            key: this.#nextKey++
        };
    }

    /** Moves focus off a row that's about to go: to the row now in its place, the one before, or the browse button. */
    #focusAfterRemoval(index: number): void {
        afterNextRender(
            () => {
                const rows = this.#hostElementRef.nativeElement.querySelectorAll<HTMLElement>("[data-file-row]");
                const row = rows[Math.min(index, rows.length - 1)];
                const button = row?.querySelector<HTMLButtonElement>("button:not(:disabled)");
                (button ?? this.browseButtonRef().nativeElement).focus();
            },
            { injector: this.#injector }
        );
    }

    /** Updates a row's item, and its abort function when given. Returns the new item, or null for a removed row. */
    #patchEntry(key: number, patch: Partial<FileUploadItem>, abort?: (() => void) | null): FileUploadItem | null {
        const entries = this.#entries();
        const index = entries.findIndex(entry => entry.key === key);
        if (index < 0) {
            return null;
        }
        const entry = entries[index];
        const item: FileUploadItem = { ...entry.item, ...patch };
        const next = [...entries];
        next[index] = { abort: abort === undefined ? entry.abort : abort, item, key };
        this.#entries.set(next);
        return item;
    }

    #positiveOrNull(value: number | null): number | null {
        return value != null && Number.isFinite(value) && value > 0 ? value : null;
    }

    #rejectionMessage(rejection: FileUploadRejection | null): string {
        const messages = this.messages();
        const localeId = this.#i18n.localeId();
        switch (rejection) {
            case "maxFileSize":
                return messages.tooLarge(formatFileSize(this.#rules().maxFileSize ?? 0, localeId));
            case "maxFiles":
                return messages.tooMany(this.multiple() ? (this.#maxFiles() ?? 1) : 1);
            case "minFileSize":
                return messages.tooSmall(formatFileSize(this.#rules().minFileSize ?? 0, localeId));
            case "type":
                return messages.invalidType;
            default:
                return "";
        }
    }

    #removeEntry(key: number): void {
        const entries = this.#entries();
        const index = entries.findIndex(entry => entry.key === key);
        if (index < 0) {
            return;
        }
        const entry = entries[index];
        const hadFocus = this.#rowHasFocus(key);
        entry.abort?.();
        this.#entries.set(entries.filter(other => other.key !== key));
        this.#writeValue();
        if (entry.item.status !== "rejected") {
            this.remove.emit(entry.item);
        }
        this.#announce(this.messages().fileRemoved(entry.item.file.name));
        if (hadFocus) {
            this.#focusAfterRemoval(index);
        }
    }

    #rowHasFocus(key: number): boolean {
        const row = this.#hostElementRef.nativeElement.querySelector(`[data-file-row="${key}"]`);
        return row != null && row.contains(this.#document.activeElement);
    }

    #startUpload(key: number): void {
        const handler = this.upload();
        const entry = this.#entries().find(other => other.key === key);
        if (handler == null || entry == null || entry.item.status === "uploading" || entry.item.status === "rejected") {
            return;
        }
        const file = entry.item.file;
        // Marked as uploading first: an observable can complete before runUpload returns.
        let abort: (() => void) | null = null;
        this.#patchEntry(key, { error: null, progress: null, response: null, status: "uploading" }, () => abort?.());
        abort = runUpload(handler, file, {
            failure: error => {
                const item = this.#patchEntry(key, { error, progress: null, status: "failed" }, null);
                if (item) {
                    this.uploadError.emit(item);
                    this.#announce(this.messages().fileFailed(file.name));
                }
            },
            progress: fraction => this.#patchEntry(key, { progress: fraction }),
            success: response => {
                const item = this.#patchEntry(key, { progress: 1, response, status: "uploaded" }, null);
                this.#writeValue();
                if (item) {
                    this.uploadSuccess.emit(item);
                    this.#announce(this.messages().fileUploaded(file.name));
                }
            }
        });
    }

    /** The files the value holds: the selected ones, or with an `upload` function, the uploaded ones. */
    #valueFiles(entries: readonly FileUploadEntry[]): File[] {
        const status: FileUploadStatus = this.upload() != null ? "uploaded" : "selected";
        return entries.filter(entry => entry.item.status === status).map(entry => entry.item.file);
    }

    #writeValue(): void {
        const files = this.#valueFiles(this.#entries());
        if (isSameFileList(files, this.value() ?? [])) {
            return;
        }
        this.#writtenValue = files;
        this.value.set(files);
    }
}

/** A number attribute that stays null when it's left out or empty, instead of turning into NaN. */
function optionalNumberAttribute(value: unknown): number | null {
    if (value == null || value === "") {
        return null;
    }
    const number = numberAttribute(value, Number.NaN);
    return Number.isNaN(number) ? null : number;
}
