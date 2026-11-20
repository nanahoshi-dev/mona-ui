import { Component, DestroyRef, inject, signal } from "@angular/core";
import { type ChatMessage, type ChatSendEvent, type ChatUser, ChatComponent } from "@nanahoshi/mona-ui/chat";

/** Files over this size "fail" to send the first time, to show the Retry button. */
const SIZE_LIMIT = 1024 * 1024;

const MOCKUP = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#dbe4f0"/>' +
        '<rect x="24" y="24" width="120" height="16" rx="4" fill="#7b93b5"/><rect x="24" y="56" width="272" height="100" ' +
        'rx="8" fill="#fff"/></svg>'
)}`;

@Component({
    selector: "app-chat-files-example",
    imports: [ChatComponent],
    templateUrl: "./files-example.component.html"
})
export class ChatFilesExampleComponent {
    readonly #timers: ReturnType<typeof setTimeout>[] = [];
    readonly #urls: string[] = [];
    #nextId = 3;
    protected readonly kenji: ChatUser = { id: "kenji", name: "Kenji Mori" };
    protected readonly me: ChatUser = { id: "me", name: "Sam Lee" };
    protected readonly messages = signal<readonly ChatMessage[]>([
        {
            attachments: [{ name: "settings-mockup.svg", size: 1840, type: "image/svg+xml", url: MOCKUP }],
            author: this.kenji,
            id: 1,
            text: "Here's the new settings page.",
            timestamp: new Date(Date.now() - 10 * 60_000)
        },
        {
            author: this.kenji,
            id: 2,
            text: "Send me the spec when you have it. Anything over 1 MB fails the first time here.",
            timestamp: new Date(Date.now() - 9 * 60_000)
        }
    ]);

    public constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.#timers.forEach(timer => clearTimeout(timer));
            this.#urls.forEach(url => URL.revokeObjectURL(url));
        });
    }

    protected onRetry(message: ChatMessage): void {
        this.#deliver(message.id, "sent");
    }

    protected onSend(event: ChatSendEvent): void {
        const id = this.#nextId++;
        const attachments = event.files.map(file => {
            const url = URL.createObjectURL(file);
            this.#urls.push(url);
            return { name: file.name, size: file.size, type: file.type, url };
        });
        this.messages.update(messages => [
            ...messages,
            { attachments, author: this.me, id, status: "sending", text: event.text, timestamp: new Date() }
        ]);
        const tooLarge = event.files.some(file => file.size > SIZE_LIMIT);
        this.#deliver(id, tooLarge ? "failed" : "sent");
    }

    /** Shows the message as sending for a moment, then as sent or failed. */
    #deliver(id: unknown, status: "failed" | "sent"): void {
        this.#setStatus(id, "sending");
        this.#timers.push(setTimeout(() => this.#setStatus(id, status), 900));
    }

    #setStatus(id: unknown, status: ChatMessage["status"]): void {
        this.messages.update(messages =>
            messages.map(message => (message.id === id ? { ...message, status } : message))
        );
    }
}
