import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    output,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { LucidePaperclip, LucideSendHorizontal, LucideSquare, LucideX } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { formatFileSize } from "@nanahoshi/mona-ui/file-upload";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { CHAT_DEFAULT_MESSAGES } from "../../i18n/chat.default-messages";
import type { ChatSendEvent } from "../../models/ChatSendEvent";
import {
    CHAT_COMPOSER_CLASSES,
    CHAT_FIELD_CLASSES,
    CHAT_FILE_CLASSES,
    CHAT_FILE_NAME_CLASSES,
    CHAT_FILES_CLASSES,
    CHAT_TEXTAREA_CLASSES
} from "../../styles/chat.styles";

/** A file is the same file when its name, size and last change are. */
function sameFile(a: File, b: File): boolean {
    return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

/**
 * The chat's message box: a text area that grows with its text, Enter to send and Shift+Enter for a new line, the
 * files attached to the message, and the Send button, which stops a reply while one streams in.
 * @hidden The chat's own part.
 */
@Component({
    selector: "mona-chat-composer",
    templateUrl: "./chat-composer.component.html",
    imports: [ButtonDirective, LucidePaperclip, LucideSendHorizontal, LucideSquare, LucideX],
    host: {
        "[class]": "composerClass"
    }
})
export class ChatComposerComponent {
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    protected readonly canSend = computed(
        () => !this.disabled() && !this.streaming() && (this.draft().trim().length > 0 || this.files().length > 0)
    );
    protected readonly composerClass = CHAT_COMPOSER_CLASSES;
    protected readonly fieldClass = CHAT_FIELD_CLASSES;
    protected readonly fileClass = CHAT_FILE_CLASSES;
    protected readonly fileNameClass = CHAT_FILE_NAME_CLASSES;
    protected readonly files = signal<readonly File[]>([]);
    protected readonly filesClass = CHAT_FILES_CLASSES;
    protected readonly messages = this.#i18n.componentMessages("chat", CHAT_DEFAULT_MESSAGES);
    protected readonly placeholderText = computed(() => this.placeholder() || this.messages().placeholder);
    protected readonly textAreaClass = CHAT_TEXTAREA_CLASSES;
    protected readonly textAreaRef = viewChild.required<ElementRef<HTMLTextAreaElement>>("textArea");

    public readonly accept = input("");
    public readonly allowFiles = input(false, { transform: booleanAttribute });
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly draft = model("");
    public readonly placeholder = input("");
    public readonly send = output<ChatSendEvent>();
    public readonly stop = output<void>();
    public readonly streaming = input(false, { transform: booleanAttribute });

    public constructor() {
        // The box fits its text whenever the text changes, also when it's set from outside, as when it's cleared.
        effect(() => {
            this.draft();
            untracked(() => afterNextRender(() => this.#fitTextArea(), { injector: this.#injector }));
        });
    }

    public focus(): void {
        this.textAreaRef().nativeElement.focus();
    }

    protected fileSize(file: File): string {
        return formatFileSize(file.size, this.#i18n.localeId());
    }

    protected onFilesPicked(picker: HTMLInputElement): void {
        const picked = Array.from(picker.files ?? []);
        // Picking a file again picks it again, rather than doing nothing.
        picker.value = "";
        this.files.update(files => [...files, ...picked.filter(file => !files.some(other => sameFile(file, other)))]);
        this.focus();
    }

    protected onInput(textArea: HTMLTextAreaElement): void {
        this.draft.set(textArea.value);
        this.#fitTextArea();
    }

    /** Enter sends, unless it picks a word in an input method's composition. Shift+Enter starts a new line. */
    protected onKeydown(event: KeyboardEvent): void {
        if (event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229) {
            return;
        }
        event.preventDefault();
        this.submit();
    }

    protected removeFile(file: File): void {
        this.files.update(files => files.filter(other => other !== file));
        this.focus();
    }

    protected submit(): void {
        if (!this.canSend()) {
            return;
        }
        this.send.emit({ files: this.files(), text: this.draft().trim() });
        this.draft.set("");
        this.files.set([]);
        // The Send button is disabled once the box is empty, which would drop focus from it.
        this.focus();
    }

    #fitTextArea(): void {
        const textArea = this.textAreaRef().nativeElement;
        textArea.style.height = "auto";
        textArea.style.height = `${textArea.scrollHeight}px`;
    }
}
