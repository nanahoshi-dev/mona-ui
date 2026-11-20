import { booleanAttribute, Component, DestroyRef, inject, input, model, signal } from "@angular/core";
import { type ChatMessage, type ChatSendEvent, type ChatUser, ChatComponent } from "@nanahoshi/mona-ui/chat";
import type { ComponentInputsAsSignal } from "../../utils/componentConfig";

/** The playground's chat: planning a team lunch, with a colleague who answers each message. */
@Component({
    imports: [ChatComponent],
    templateUrl: "./chat-demo-conversation.component.html"
})
export class ChatDemoConversationComponent implements ComponentInputsAsSignal<ChatComponent> {
    readonly #timers: ReturnType<typeof setTimeout>[] = [];
    #nextId = 4;
    protected readonly ana: ChatUser = { id: "ana", name: "Ana Silva" };
    protected readonly me: ChatUser = { id: "me", name: "Sam Lee" };
    protected readonly conversation = signal<readonly ChatMessage[]>([
        {
            author: this.ana,
            id: 1,
            text: "Team lunch on Friday? I was thinking the noodle place.",
            timestamp: new Date(Date.now() - 30 * 60_000)
        },
        { author: this.me, id: 2, text: "Yes! What time?", timestamp: new Date(Date.now() - 28 * 60_000) },
        {
            author: this.ana,
            id: 3,
            text: "Half past twelve.\nI'll book a table for six.",
            timestamp: new Date(Date.now() - 27 * 60_000)
        }
    ]);

    public readonly allowFiles = input(false, { transform: booleanAttribute });
    public readonly disabled = input(false, { transform: booleanAttribute });
    public readonly draft = model("");
    public readonly placeholder = input("");
    public readonly suggestions = input<readonly string[]>([]);
    public readonly timeFormat = input<Intl.DateTimeFormatOptions>({ hour: "numeric", minute: "2-digit" });
    public readonly typing = input<readonly ChatUser[]>([]);
    public readonly userClass = input("");

    public constructor() {
        inject(DestroyRef).onDestroy(() => this.#timers.forEach(timer => clearTimeout(timer)));
    }

    protected onSend(event: ChatSendEvent): void {
        const attachments = event.files.map(file => ({ name: file.name, size: file.size, type: file.type }));
        this.conversation.update(messages => [
            ...messages,
            { attachments, author: this.me, id: this.#nextId++, text: event.text, timestamp: new Date() }
        ]);
        this.#timers.push(
            setTimeout(() => {
                this.conversation.update(messages => [
                    ...messages,
                    { author: this.ana, id: this.#nextId++, text: "Got it 👍", timestamp: new Date() }
                ]);
            }, 1200)
        );
    }
}
