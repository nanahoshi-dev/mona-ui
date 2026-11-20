import { Component, computed, DestroyRef, inject, signal } from "@angular/core";
import {
    type ChatMessage,
    type ChatSendEvent,
    type ChatUser,
    ChatComponent,
    ChatEmptyTemplateDirective,
    ChatMessageTemplateDirective
} from "@nanahoshi/mona-ui/chat";

/** A paragraph, or the lines of a list, of a reply's text. */
type Block =
    { readonly kind: "list"; readonly items: readonly string[] } | { readonly kind: "text"; readonly text: string };

const ANSWERS: Readonly<Record<string, string>> = {
    "Which components work in forms?":
        "Every input works with reactive forms and template-driven forms:\n- Text box, text area and masked text box\n- Drop-downs, combo box and multi-select\n- Date, time and color pickers",
    "How do I show a chart?":
        "Add a chart with one series:\n- Import ChartComponent and a series, such as the line series\n- Give the series your data and a field\n- Size the chart with a class"
};

const FALLBACK =
    "I'm a pretend assistant, so I only know two answers. Try one of the suggestions:\n- Which components work in forms?\n- How do I show a chart?";

@Component({
    selector: "app-chat-assistant-example",
    imports: [ChatComponent, ChatEmptyTemplateDirective, ChatMessageTemplateDirective],
    templateUrl: "./assistant-example.component.html"
})
export class ChatAssistantExampleComponent {
    #nextId = 1;
    #stream: ReturnType<typeof setInterval> | null = null;
    protected readonly assistant: ChatUser = { id: "assistant", name: "Docs Assistant" };
    protected readonly me: ChatUser = { id: "me", name: "Sam Lee" };
    protected readonly messages = signal<readonly ChatMessage[]>([]);
    /** Starter questions in an empty chat, and one follow-up after that. */
    protected readonly suggestions = computed(() =>
        this.messages().length === 0 ? Object.keys(ANSWERS) : ["Tell me something else"]
    );

    public constructor() {
        inject(DestroyRef).onDestroy(() => this.onStop());
    }

    /** Splits a reply into paragraphs and lists, where each line starting with "- " is an item. */
    protected blocks(text: string): Block[] {
        const blocks: Block[] = [];
        for (const line of text.split("\n")) {
            const last = blocks.at(-1);
            if (line.startsWith("- ")) {
                if (last?.kind === "list") {
                    blocks[blocks.length - 1] = { items: [...last.items, line.slice(2)], kind: "list" };
                } else {
                    blocks.push({ items: [line.slice(2)], kind: "list" });
                }
            } else if (line.trim()) {
                blocks.push({ kind: "text", text: line });
            }
        }
        return blocks;
    }

    protected onSend(event: ChatSendEvent): void {
        this.messages.update(messages => [
            ...messages,
            { author: this.me, id: this.#nextId++, text: event.text, timestamp: new Date() }
        ]);
        this.#streamReply(ANSWERS[event.text] ?? FALLBACK);
    }

    /** Stops the reply where it got to. */
    protected onStop(): void {
        if (this.#stream != null) {
            clearInterval(this.#stream);
            this.#stream = null;
        }
        this.messages.update(messages =>
            messages.map(message => (message.streaming ? { ...message, streaming: false } : message))
        );
    }

    /** Streams the reply in a word at a time, as a model's tokens arrive. */
    #streamReply(reply: string): void {
        const id = this.#nextId++;
        const words = reply.split(/(?<=\s)/);
        let shown = 0;
        this.messages.update(messages => [
            ...messages,
            { author: this.assistant, id, streaming: true, text: "", timestamp: new Date() }
        ]);
        this.#stream = setInterval(() => {
            shown++;
            const done = shown >= words.length;
            const text = words.slice(0, shown).join("");
            this.messages.update(messages =>
                messages.map(message => (message.id === id ? { ...message, streaming: !done, text } : message))
            );
            if (done) {
                this.onStop();
            }
        }, 60);
    }
}
