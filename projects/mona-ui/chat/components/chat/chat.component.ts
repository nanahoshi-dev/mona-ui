import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    model,
    output,
    signal,
    TemplateRef,
    untracked,
    viewChild
} from "@angular/core";
import { LucideArrowDown, LucideFile } from "@lucide/angular";
import { AvatarComponent } from "@nanahoshi/mona-ui/avatar";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { formatFileSize } from "@nanahoshi/mona-ui/file-upload";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { injectLiveAnnouncer } from "@nanahoshi/mona-ui/internal/live-announcer";
import { twMerge } from "tailwind-merge";
import { ChatAttachmentTemplateDirective } from "../../directives/chat-attachment-template.directive";
import { ChatEmptyTemplateDirective } from "../../directives/chat-empty-template.directive";
import { ChatMessageTemplateDirective } from "../../directives/chat-message-template.directive";
import { CHAT_DEFAULT_MESSAGES } from "../../i18n/chat.default-messages";
import type { ChatAttachment, ChatMessage } from "../../models/ChatMessage";
import type { ChatSendEvent } from "../../models/ChatSendEvent";
import type { ChatAttachmentTemplateContext, ChatMessageTemplateContext } from "../../models/ChatTemplateContext";
import type { ChatUser } from "../../models/ChatUser";
import {
    CHAT_ATTACHMENT_CLASSES,
    CHAT_ATTACHMENT_IMAGE_CLASSES,
    CHAT_ATTACHMENT_ROW_CLASSES,
    CHAT_ATTACHMENT_SIZE_CLASSES,
    CHAT_ATTACHMENTS_CLASSES,
    CHAT_AUTHOR_CLASSES,
    CHAT_AVATAR_CLASSES,
    CHAT_CARET_CLASSES,
    CHAT_DAY_CLASSES,
    CHAT_DAY_LABEL_CLASSES,
    CHAT_EMPTY_CLASSES,
    CHAT_FAILED_CLASSES,
    CHAT_LOG_CLASSES,
    CHAT_LOG_FRAME_CLASSES,
    CHAT_NEW_MESSAGES_CLASSES,
    CHAT_STATUS_CLASSES,
    CHAT_SUGGESTIONS_CLASSES,
    CHAT_TEXT_CLASSES,
    CHAT_TIME_CLASSES,
    CHAT_TYPING_CLASSES,
    CHAT_TYPING_DOTS_CLASSES,
    chatAttachmentLinkThemeVariants,
    chatBaseThemeVariants,
    chatBubbleThemeVariants,
    chatRunBodyThemeVariants,
    chatRunThemeVariants
} from "../../styles/chat.styles";
import { buildChatDays, type ChatEntry, chatMessageKey } from "../../utils/chat-entries";
import { ChatComposerComponent } from "../chat-composer/chat-composer.component";

/** How close to the bottom the messages count as scrolled to it, in pixels. */
const BOTTOM_SLACK = 32;

/**
 * @description
 * A conversation: its messages, by day, with the user's at the end and others' at the start beside their avatar, and a
 * message box below them. Enter sends a message, Shift+Enter starts a new line, and files can go with it. The chat
 * emits what the user sends through `send`, and shows what you give it in `messages`, so add the message there.
 *
 * It keeps to the newest message while the user is reading there, and offers a button to the new ones when they've
 * scrolled up. Messages from others are announced as they arrive, and a reply that streams in once it's done. While
 * one streams, the Send button stops it. Suggested replies sit above the message box, and who's typing below the
 * messages.
 */
@Component({
    selector: "mona-chat",
    templateUrl: "./chat.component.html",
    imports: [AvatarComponent, ButtonDirective, ChatComposerComponent, LucideArrowDown, LucideFile, NgTemplateOutlet],
    host: {
        // The name is the messages', not the host's, which has no role to carry it.
        "[attr.aria-label]": "null",
        "[class]": "baseClass()"
    }
})
export class ChatComponent {
    readonly #announcer = injectLiveAnnouncer();
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    readonly #messageList = computed(() => Array.from(this.messages()));
    /** Whether the messages were at the bottom when last scrolled, so that new ones keep them there. */
    #atBottom = true;
    /** Each message shown, by key, and whether it was streaming then. `null` until the first messages are shown. */
    #known: Map<unknown, boolean> | null = null;
    #messageCount = 0;
    protected readonly attachmentClass = CHAT_ATTACHMENT_CLASSES;
    protected readonly attachmentImageClass = CHAT_ATTACHMENT_IMAGE_CLASSES;
    protected readonly attachmentRowClass = CHAT_ATTACHMENT_ROW_CLASSES;
    protected readonly attachmentSizeClass = CHAT_ATTACHMENT_SIZE_CLASSES;
    protected readonly attachmentTemplate = contentChild(ChatAttachmentTemplateDirective, { read: TemplateRef });
    protected readonly attachmentsClass = CHAT_ATTACHMENTS_CLASSES;
    protected readonly authorClass = CHAT_AUTHOR_CLASSES;
    protected readonly avatarClass = CHAT_AVATAR_CLASSES;
    protected readonly baseClass = computed(() => twMerge(chatBaseThemeVariants(), this.userClass()));
    protected readonly caretClass = CHAT_CARET_CLASSES;
    protected readonly composerRef = viewChild.required(ChatComposerComponent);
    protected readonly dayClass = CHAT_DAY_CLASSES;
    protected readonly dayLabelClass = CHAT_DAY_LABEL_CLASSES;
    protected readonly days = computed(() =>
        buildChatDays(this.#messageList(), {
            locale: this.#i18n.localeId(),
            now: new Date(),
            timeFormat: this.timeFormat(),
            userId: this.user().id
        })
    );
    protected readonly emptyClass = CHAT_EMPTY_CLASSES;
    protected readonly emptyTemplate = contentChild(ChatEmptyTemplateDirective, { read: TemplateRef });
    protected readonly failedClass = CHAT_FAILED_CLASSES;
    protected readonly labels = this.#i18n.componentMessages("chat", CHAT_DEFAULT_MESSAGES);
    protected readonly logClass = CHAT_LOG_CLASSES;
    protected readonly logFrameClass = CHAT_LOG_FRAME_CLASSES;
    protected readonly logLabel = computed(() => this.ariaLabel().trim() || this.labels().messages);
    protected readonly logRef = viewChild.required<ElementRef<HTMLElement>>("log");
    protected readonly messageTemplate = contentChild(ChatMessageTemplateDirective, { read: TemplateRef });
    protected readonly newMessagesClass = CHAT_NEW_MESSAGES_CLASSES;
    protected readonly statusClass = CHAT_STATUS_CLASSES;
    /** Whether a reply is streaming in, which turns the Send button into Stop and hides the suggested replies. */
    protected readonly streaming = computed(() => this.#messageList().some(message => message.streaming === true));
    protected readonly suggestionsClass = CHAT_SUGGESTIONS_CLASSES;
    protected readonly textClass = CHAT_TEXT_CLASSES;
    protected readonly timeClass = CHAT_TIME_CLASSES;
    protected readonly typingClass = CHAT_TYPING_CLASSES;
    protected readonly typingDotsClass = CHAT_TYPING_DOTS_CLASSES;
    /** Who's typing, by name for up to three people, joined in the locale's way, or how many for more. */
    protected readonly typingText = computed(() => {
        const users = this.typing();
        const labels = this.labels();
        if (users.length === 0) {
            return "";
        }
        if (users.length > 3) {
            return labels.typingMany(users.length);
        }
        const names = new Intl.ListFormat(this.#i18n.localeId(), { style: "long", type: "conjunction" }).format(
            users.map(user => user.name)
        );
        return labels.typing(names, users.length);
    });
    /** Whether messages arrived while the user was reading earlier ones. */
    protected readonly unseen = signal(false);

    /**
     * @description The file types the file picker offers, as its `accept` attribute takes them, such as
     * `"image/*,.pdf"`. Every type when empty.
     * @default ""
     */
    public readonly accept = input("");

    /**
     * @description Shows a button that attaches files to the message, through the file picker. The files go out with
     * the message in `send`; upload them, and give the message its `attachments`.
     * @default false
     */
    public readonly allowFiles = input(false, { transform: booleanAttribute });

    /**
     * @description The chat's name, such as "Support chat", which names its list of messages. "Messages" when empty.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description Disables the message box, its buttons and the suggested replies, such as while the chat is offline.
     * The messages can still be read and scrolled.
     * @default false
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description The text in the message box. Bind it two-way, `[(draft)]`, to keep a draft per conversation, or to
     * tell others the user is typing.
     * @default ""
     */
    public readonly draft = model("");

    /**
     * @description The messages, oldest first. Give each an `id`, so one replaced with a copy, as a reply streaming in
     * is, stays the same message.
     * @default []
     */
    public readonly messages = input<Iterable<ChatMessage>>([]);

    /**
     * @description The message box's placeholder. "Type a message" in the locale when empty.
     * @default ""
     */
    public readonly placeholder = input("");

    /**
     * @description Emitted with a message of the user's that couldn't be sent, when they press its Retry button. Send
     * it again, and set its `status`.
     */
    public readonly retry = output<ChatMessage>();

    /**
     * @description Emitted with what the user sends: a message's text, trimmed, and its files, or a suggested reply
     * they press. Add the message to `messages` to show it.
     */
    public readonly send = output<ChatSendEvent>();

    /**
     * @description Emitted when the user presses Stop while a reply streams in. Stop it, and set its `streaming` to
     * `false`.
     */
    public readonly stop = output<void>();

    /**
     * @description Replies the user can send with a press, shown above the message box while no reply is streaming
     * in. Pressing one emits `send` with its text.
     * @default []
     */
    public readonly suggestions = input<readonly string[]>([]);

    /**
     * @description How the time under each run of messages is formatted, in the locale.
     * @default { hour: "numeric", minute: "2-digit" }
     */
    public readonly timeFormat = input<Intl.DateTimeFormatOptions>({ hour: "numeric", minute: "2-digit" });

    /**
     * @description The people typing, shown below the messages: "Ana is typing", or how many for more than three.
     * @default []
     */
    public readonly typing = input<readonly ChatUser[]>([]);

    /**
     * @description The user: messages whose author has their `id` are theirs, shown at the end without a name.
     */
    public readonly user = input.required<ChatUser>();

    /**
     * @description Additional CSS classes merged onto the host element via `tailwind-merge`, such as a height: the chat
     * is 32rem tall by default.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        effect(() => {
            const messages = this.#messageList();
            this.days();
            untracked(() => this.#onMessagesChange(messages));
        });

        // When the message box grows or the chat is resized, the newest message stays in view.
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            if (typeof ResizeObserver === "undefined") {
                return;
            }
            const observer = new ResizeObserver(() => {
                if (this.#atBottom) {
                    this.#scrollToBottom();
                }
            });
            observer.observe(this.logRef().nativeElement);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    /** Moves focus to the message box. */
    public focus(): void {
        this.composerRef().focus();
    }

    protected attachmentContext(attachment: ChatAttachment, entry: ChatEntry): ChatAttachmentTemplateContext {
        return { $implicit: attachment, message: entry.message, mine: entry.mine };
    }

    protected attachmentLinkClass(mine: boolean): string {
        return chatAttachmentLinkThemeVariants({ mine });
    }

    protected bubbleClass(entry: ChatEntry): string {
        return chatBubbleThemeVariants({ mine: entry.mine, sending: entry.message.status === "sending" });
    }

    protected fileSize(size: number): string {
        return formatFileSize(size, this.#i18n.localeId());
    }

    /** The first letters of the first two words of a name, for an avatar without a picture. */
    protected initials(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(word => Array.from(word)[0] ?? "")
            .join("")
            .toLocaleUpperCase(this.#i18n.localeId());
    }

    protected isImage(attachment: ChatAttachment): boolean {
        return !!attachment.url && !!attachment.type?.startsWith("image/");
    }

    protected messageContext(entry: ChatEntry): ChatMessageTemplateContext {
        return { $implicit: entry.message, mine: entry.mine };
    }

    /** A picture that loads makes the messages taller; the newest stays in view. */
    protected onMediaLoad(): void {
        if (this.#atBottom) {
            this.#scrollToBottom();
        }
    }

    protected onRetry(message: ChatMessage): void {
        this.retry.emit(message);
        // The button goes once the message is sent again, which would drop focus.
        this.focus();
    }

    protected onScroll(): void {
        const log = this.logRef().nativeElement;
        this.#atBottom = log.scrollHeight - log.scrollTop - log.clientHeight <= BOTTOM_SLACK;
        if (this.#atBottom) {
            this.unseen.set(false);
        }
    }

    protected onSend(event: ChatSendEvent): void {
        // The user's own message brings them to the bottom, wherever they were reading.
        this.#atBottom = true;
        this.send.emit(event);
    }

    protected onSuggestion(text: string): void {
        this.onSend({ files: [], text });
        this.focus();
    }

    protected runBodyClass(mine: boolean): string {
        return chatRunBodyThemeVariants({ mine });
    }

    protected runClass(mine: boolean): string {
        return chatRunThemeVariants({ mine });
    }

    protected showNewMessages(): void {
        this.#scrollToBottom();
        this.unseen.set(false);
        // The button goes once the messages are at the bottom, which would drop focus.
        this.focus();
    }

    /**
     * Announces the messages from others that arrived since the last change, and the replies that finished streaming.
     * Those shown first, and the user's own, aren't announced.
     */
    #announce(messages: readonly ChatMessage[]): void {
        const known = this.#known;
        const next = new Map<unknown, boolean>();
        const userId = this.user().id;
        const announcements: string[] = [];
        for (const message of messages) {
            const key = chatMessageKey(message);
            const streaming = message.streaming === true;
            next.set(key, streaming);
            if (known == null || streaming || message.author.id === userId || known.get(key) === false) {
                continue;
            }
            const text = message.text?.trim() || (message.attachments ?? []).map(file => file.name).join(", ");
            if (text) {
                announcements.push(this.labels().newMessage(message.author.name, text));
            }
        }
        this.#known = next;
        if (announcements.length > 0) {
            // One announcement, as each would cut off the one before.
            void this.#announcer.announce(announcements.join("\n"), "polite");
        }
    }

    #onMessagesChange(messages: readonly ChatMessage[]): void {
        const added = messages.length > this.#messageCount;
        const latestIsMine = added && messages.at(-1)?.author.id === this.user().id;
        this.#messageCount = messages.length;
        this.#announce(messages);
        afterNextRender(
            () => {
                if (this.#atBottom || latestIsMine) {
                    this.#scrollToBottom();
                } else if (added) {
                    this.unseen.set(true);
                }
            },
            { injector: this.#injector }
        );
    }

    #scrollToBottom(): void {
        const log = this.logRef().nativeElement;
        log.scrollTop = log.scrollHeight;
        this.#atBottom = true;
    }
}
