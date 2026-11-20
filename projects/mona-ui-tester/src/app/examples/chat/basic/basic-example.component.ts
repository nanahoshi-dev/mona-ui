import { Component, DestroyRef, inject, signal } from "@angular/core";
import { type ChatMessage, type ChatSendEvent, type ChatUser, ChatComponent } from "@nanahoshi/mona-ui/chat";

function minutesAgo(minutes: number): Date {
    return new Date(Date.now() - minutes * 60_000);
}

const REPLIES = ["Nice, thanks!", "Sounds good to me.", "On it.", "Let's talk at the stand-up."];

@Component({
    selector: "app-chat-basic-example",
    imports: [ChatComponent],
    templateUrl: "./basic-example.component.html"
})
export class ChatBasicExampleComponent {
    readonly #timers: ReturnType<typeof setTimeout>[] = [];
    #nextId = 5;
    #nextReply = 0;
    protected readonly ana: ChatUser = { id: "ana", name: "Ana Silva" };
    protected readonly me: ChatUser = { id: "me", name: "Sam Lee" };
    protected readonly messages = signal<readonly ChatMessage[]>([
        { author: this.ana, id: 1, text: "Did the release go out?", timestamp: minutesAgo(25 * 60) },
        { author: this.me, id: 2, text: "Not yet, the last test is flaky.", timestamp: minutesAgo(25 * 60 - 3) },
        { author: this.ana, id: 3, text: "Morning! Any luck with that test?", timestamp: minutesAgo(40) },
        { author: this.ana, id: 4, text: "I can pair on it after lunch.", timestamp: minutesAgo(39) }
    ]);
    protected readonly typing = signal<readonly ChatUser[]>([]);

    public constructor() {
        inject(DestroyRef).onDestroy(() => this.#timers.forEach(timer => clearTimeout(timer)));
    }

    protected onSend(event: ChatSendEvent): void {
        this.messages.update(messages => [
            ...messages,
            { author: this.me, id: this.#nextId++, text: event.text, timestamp: new Date() }
        ]);
        // Ana types for a moment, then answers.
        this.#timers.push(
            setTimeout(() => this.typing.set([this.ana]), 500),
            setTimeout(() => {
                this.typing.set([]);
                const text = REPLIES[this.#nextReply++ % REPLIES.length];
                this.messages.update(messages => [
                    ...messages,
                    { author: this.ana, id: this.#nextId++, text, timestamp: new Date() }
                ]);
            }, 2000)
        );
    }
}
