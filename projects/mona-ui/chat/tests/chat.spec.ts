import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatComponent } from "../components/chat/chat.component";
import { ChatAttachmentTemplateDirective } from "../directives/chat-attachment-template.directive";
import { ChatEmptyTemplateDirective } from "../directives/chat-empty-template.directive";
import { ChatMessageTemplateDirective } from "../directives/chat-message-template.directive";
import type { ChatMessage } from "../models/ChatMessage";
import type { ChatSendEvent } from "../models/ChatSendEvent";
import type { ChatUser } from "../models/ChatUser";

const ME: ChatUser = { id: "me", name: "Sam Lee" };
const ANA: ChatUser = { id: "ana", name: "Ana Silva" };
const BEN: ChatUser = { id: "ben", name: "Ben" };

function at(day: number, hour: number, minute: number): Date {
    return new Date(2026, 10, day, hour, minute);
}

const MESSAGES: readonly ChatMessage[] = [
    { author: ANA, id: 1, text: "Hi Sam!", timestamp: at(19, 18, 0) },
    { author: ANA, id: 2, text: "Is the build green?", timestamp: at(19, 18, 1) },
    { author: ME, id: 3, text: "Yes, all of it.", timestamp: at(20, 9, 0) }
];

@Component({
    imports: [ChatComponent],
    template: `
        <mona-chat
            aria-label="Release chat"
            [allowFiles]="allowFiles()"
            [disabled]="disabled()"
            [messages]="messages()"
            [suggestions]="suggestions()"
            [typing]="typing()"
            [user]="me"
            [(draft)]="draft"
            (retry)="retried.push($event)"
            (send)="sent.push($event)"
            (stop)="onStop()" />
    `
})
class ChatHostComponent {
    public readonly allowFiles = signal(false);
    public readonly disabled = signal(false);
    public readonly draft = signal("");
    public readonly me = ME;
    public readonly messages = signal<readonly ChatMessage[]>(MESSAGES);
    public readonly retried: ChatMessage[] = [];
    public readonly sent: ChatSendEvent[] = [];
    public readonly suggestions = signal<readonly string[]>([]);
    public readonly typing = signal<readonly ChatUser[]>([]);
    public stops = 0;

    public onStop(): void {
        this.stops++;
    }
}

@Component({
    imports: [ChatAttachmentTemplateDirective, ChatComponent, ChatEmptyTemplateDirective, ChatMessageTemplateDirective],
    template: `
        <mona-chat [messages]="messages()" [user]="me">
            <ng-template monaChatMessageTemplate let-message let-mine="mine">
                <strong class="message">{{ mine ? "mine" : "theirs" }}: {{ message.text }}</strong>
            </ng-template>
            <ng-template monaChatAttachmentTemplate let-attachment let-mine="mine">
                <em class="attachment">{{ attachment.name }} {{ mine }}</em>
            </ng-template>
            <ng-template monaChatEmptyTemplate><span class="empty">Ask me anything</span></ng-template>
        </mona-chat>
    `
})
class TemplateHostComponent {
    public readonly me = ME;
    public readonly messages = signal<readonly ChatMessage[]>([]);
}

describe("ChatComponent", () => {
    let fixture: ComponentFixture<ChatHostComponent>;
    let host: ChatHostComponent;

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 10, 20, 15, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
        (fixture?.nativeElement as HTMLElement | undefined)?.remove();
    });

    async function create(): Promise<ChatHostComponent> {
        await TestBed.configureTestingModule({ imports: [ChatHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(ChatHostComponent);
        host = fixture.componentInstance;
        document.body.append(fixture.nativeElement as HTMLElement);
        await stable();
        return host;
    }

    async function stable(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function element(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function textArea(): HTMLTextAreaElement {
        return element().querySelector("textarea") as HTMLTextAreaElement;
    }

    function button(name: string): HTMLButtonElement | undefined {
        return Array.from(element().querySelectorAll("button")).find(
            candidate => (candidate.getAttribute("aria-label") ?? candidate.textContent?.trim()) === name
        );
    }

    /** The node's text nodes, joined by spaces as a browser joins its blocks, which jsdom doesn't lay out. */
    function text(node: Element | null | undefined): string {
        if (node == null) {
            return "";
        }
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const parts: string[] = [];
        for (let current = walker.nextNode(); current != null; current = walker.nextNode()) {
            parts.push(current.textContent ?? "");
        }
        return parts.join(" ").replace(/\s+/g, " ").trim();
    }

    async function type(value: string): Promise<void> {
        textArea().value = value;
        textArea().dispatchEvent(new Event("input"));
        await stable();
    }

    async function press(key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
        textArea().dispatchEvent(event);
        await stable();
        return event;
    }

    it("shows the messages in a log named by its label, which announces nothing itself and takes focus", async () => {
        await create();
        const log = element().querySelector("[role=log]");

        expect(element().querySelector("mona-chat")?.hasAttribute("aria-label")).toBe(false);
        expect(log?.getAttribute("aria-label")).toBe("Release chat");
        expect(log?.getAttribute("aria-live")).toBe("off");
        expect(log?.getAttribute("tabindex")).toBe("0");
    });

    it("puts each day under its label, and runs of one author's messages under one name and one time", async () => {
        await create();
        const days = Array.from(element().querySelectorAll("[role=log] > div"));

        expect(days.map(day => text(day.querySelector("time")))).toEqual(["Yesterday", "Today"]);
        expect(text(days[0])).toBe("Yesterday AS Ana Silva Hi Sam! Is the build green? 6:01 PM");
        // The user's own run is named for assistive technology only, and has no avatar.
        expect(text(days[1])).toBe("Today You Yes, all of it. 9:00 AM");
        expect(days[1].querySelector(".sr-only")?.textContent?.trim()).toBe("You");
        expect(days[1].querySelector("mona-avatar")).toBeNull();
        expect(days[0].querySelector("mona-avatar")?.closest("[aria-hidden=true]")).not.toBeNull();
    });

    it("lets the messages, the names and the message box read in the direction of their text", async () => {
        await create();
        const log = element().querySelector("[role=log]")!;

        expect(Array.from(log.querySelectorAll("p"), p => p.getAttribute("dir"))).toEqual(["auto", "auto", "auto"]);
        expect(Array.from(log.querySelectorAll("span[dir=auto]"), span => span.textContent?.trim())).toEqual([
            "Ana Silva",
            "You"
        ]);
        // An empty box follows the page, as an empty one set to auto reads left to right, placeholder and all.
        expect(textArea().hasAttribute("dir")).toBe(false);
        await type("مرحبا");
        expect(textArea().getAttribute("dir")).toBe("auto");
    });

    it("says so when there are no messages", async () => {
        const chat = await create();
        chat.messages.set([]);
        await stable();

        expect(text(element().querySelector("[role=log]"))).toBe("No messages yet");
    });

    describe("message box", () => {
        it("sends the trimmed text with Enter, and clears the box, binding the draft two-way", async () => {
            const chat = await create();
            await type("  Ship it  ");
            expect(chat.draft()).toBe("  Ship it  ");

            const event = await press("Enter");

            expect(event.defaultPrevented).toBe(true);
            expect(chat.sent).toEqual([{ files: [], text: "Ship it" }]);
            expect(chat.draft()).toBe("");
            expect(textArea().value).toBe("");
        });

        it("starts a new line with Shift+Enter, and doesn't send while an input method composes", async () => {
            const chat = await create();
            await type("こんにちは");

            expect((await press("Enter", { shiftKey: true })).defaultPrevented).toBe(false);
            expect((await press("Enter", { isComposing: true })).defaultPrevented).toBe(false);
            expect(chat.sent).toEqual([]);
        });

        it("names the box and its Send button, which sends and is disabled with nothing to send", async () => {
            const chat = await create();

            expect(textArea().getAttribute("aria-label")).toBe("Message");
            expect(textArea().placeholder).toBe("Type a message");
            expect(button("Send")?.disabled).toBe(true);
            await type("   ");
            expect(button("Send")?.disabled).toBe(true);

            await type("Done");
            button("Send")?.click();
            await stable();

            expect(chat.sent).toEqual([{ files: [], text: "Done" }]);
            expect(document.activeElement).toBe(textArea());
        });

        it("shows what's set as the draft", async () => {
            const chat = await create();
            chat.draft.set("Half-written");
            await stable();

            expect(textArea().value).toBe("Half-written");
        });

        it("attaches picked files, which can be removed and go with the message", async () => {
            const chat = await create();
            chat.allowFiles.set(true);
            await stable();
            const picker = element().querySelector<HTMLInputElement>("input[type=file]")!;
            const report = new File(["x".repeat(2048)], "report.pdf", { type: "application/pdf" });
            const photo = new File(["y"], "photo.png", { type: "image/png" });
            Object.defineProperty(picker, "files", { configurable: true, value: [report, photo] });
            picker.dispatchEvent(new Event("change"));
            await stable();

            expect(button("Attach files")).toBeDefined();
            expect(text(element().querySelector("mona-chat-composer ul"))).toBe("report.pdf 2 kB photo.png 1 byte");
            expect(button("Send")?.disabled).toBe(false);

            button("Remove photo.png")?.click();
            await stable();
            button("Send")?.click();
            await stable();

            expect(chat.sent).toEqual([{ files: [report], text: "" }]);
            expect(element().querySelector("mona-chat-composer ul")).toBeNull();
        });

        it("disables the box and its buttons", async () => {
            const chat = await create();
            chat.allowFiles.set(true);
            chat.disabled.set(true);
            chat.suggestions.set(["Thanks!"]);
            await stable();

            expect(textArea().disabled).toBe(true);
            expect(button("Attach files")?.disabled).toBe(true);
            expect(button("Thanks!")?.disabled).toBe(true);
        });
    });

    it("sends a suggested reply, from a named group, and moves focus to the message box", async () => {
        const chat = await create();
        chat.suggestions.set(["Thanks!", "Not yet"]);
        await stable();

        expect(element().querySelector("[role=group]")?.getAttribute("aria-label")).toBe("Suggested replies");
        button("Not yet")?.click();
        await stable();

        expect(chat.sent).toEqual([{ files: [], text: "Not yet" }]);
        expect(document.activeElement).toBe(textArea());
    });

    it("says who's typing, by name for up to three people", async () => {
        const chat = await create();
        const typing = (): string => text(element().querySelector("mona-chat > div:nth-of-type(2)"));
        expect(typing()).toBe("");

        chat.typing.set([ANA]);
        await stable();
        expect(typing()).toBe("Ana Silva is typing");

        chat.typing.set([ANA, BEN]);
        await stable();
        expect(typing()).toBe("Ana Silva and Ben are typing");

        chat.typing.set([ANA, BEN, ME, { id: "kim", name: "Kim" }]);
        await stable();
        expect(typing()).toBe("4 people are typing");
    });

    describe("streaming", () => {
        it("turns Send into Stop, hides the suggestions, and marks the reply busy with a caret", async () => {
            const chat = await create();
            chat.suggestions.set(["Thanks!"]);
            chat.messages.update(messages => [...messages, { author: ANA, id: 4, streaming: true, text: "Let me" }]);
            await stable();
            await type("Next question");

            expect(button("Send")).toBeUndefined();
            expect(button("Thanks!")).toBeUndefined();
            const bubble = element().querySelector("[aria-busy=true]");
            expect(text(bubble)).toBe("Let me");
            // The caret follows the last word, as the paragraph before it runs inline.
            expect(bubble?.querySelector("p + [data-chat-caret][aria-hidden=true]")).not.toBeNull();

            expect((await press("Enter")).defaultPrevented).toBe(true);
            expect(chat.sent).toEqual([]);
            expect(chat.draft()).toBe("Next question");

            button("Stop")?.click();
            expect(chat.stops).toBe(1);
        });
    });

    describe("status", () => {
        it("shows a message being sent, and one that wasn't with a Retry button", async () => {
            const chat = await create();
            const failed: ChatMessage = { author: ME, id: 5, status: "failed", text: "Lost" };
            chat.messages.update(messages => [
                ...messages,
                { author: ME, id: 4, status: "sending", text: "Going" },
                failed
            ]);
            await stable();
            const log = text(element().querySelector("[role=log]"));

            expect(log).toContain("Going Sending");
            expect(log).toContain("Lost Not sent Retry");
            button("Retry")?.click();
            await stable();

            expect(chat.retried).toEqual([failed]);
            expect(document.activeElement).toBe(textArea());
        });
    });

    it("shows sent files: a picture with its link, and each file's name and size", async () => {
        const chat = await create();
        chat.messages.set([
            {
                attachments: [
                    { name: "diagram.png", size: 1536, type: "image/png", url: "https://example.com/diagram.png" },
                    { name: "notes.txt" }
                ],
                author: ANA,
                id: 1,
                text: "Files"
            }
        ]);
        await stable();
        const items = Array.from(element().querySelectorAll("[role=log] li"));

        expect(items.map(item => text(item))).toEqual(["diagram.png 1.5 kB", "notes.txt"]);
        expect(items[0].querySelector("img")?.getAttribute("alt")).toBe("");
        expect(items[0].querySelector("a")?.getAttribute("href")).toBe("https://example.com/diagram.png");
        expect(items[1].querySelector("a")).toBeNull();
    });

    describe("announcements", () => {
        it("announces others' new messages, not the first ones or the user's, and a reply once it's done", async () => {
            const chat = await create();
            const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), "announce").mockResolvedValue();
            expect(announce).not.toHaveBeenCalled();

            chat.messages.update(messages => [...messages, { author: ME, id: 4, text: "Mine" }]);
            await stable();
            expect(announce).not.toHaveBeenCalled();

            chat.messages.update(messages => [...messages, { author: ANA, id: 5, streaming: true, text: "Work" }]);
            await stable();
            expect(announce).not.toHaveBeenCalled();

            chat.messages.update(messages => [...messages.slice(0, -1), { author: ANA, id: 5, text: "Working on it" }]);
            await stable();
            expect(announce).toHaveBeenCalledExactlyOnceWith("Ana Silva: Working on it", "polite");

            chat.messages.update(messages => [
                ...messages,
                { author: BEN, id: 6, text: "Me too" },
                { attachments: [{ name: "log.txt" }], author: ANA, id: 7 }
            ]);
            await stable();
            expect(announce).toHaveBeenLastCalledWith("Ben: Me too\nAna Silva: log.txt", "polite");
        });
    });

    it("passes axe, with suggestions, files and someone typing", async () => {
        const chat = await create();
        chat.allowFiles.set(true);
        chat.suggestions.set(["Thanks!"]);
        chat.typing.set([ANA]);
        chat.messages.update(messages => [...messages, { author: ME, id: 4, status: "failed", text: "Lost" }]);
        await stable();
        const results = await axe.run(element());

        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });
});

describe("ChatComponent templates", () => {
    it("renders the message, attachment and empty templates with their contexts", async () => {
        await TestBed.configureTestingModule({ imports: [TemplateHostComponent] }).compileComponents();
        const fixture = TestBed.createComponent(TemplateHostComponent);
        const element = fixture.nativeElement as HTMLElement;
        document.body.append(element);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(element.querySelector(".empty")?.textContent).toBe("Ask me anything");

        fixture.componentInstance.messages.set([
            { attachments: [{ name: "a.txt" }], author: ME, id: 1, text: "Hello" },
            { author: ANA, id: 2, text: "Hi" }
        ]);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(Array.from(element.querySelectorAll(".message"), node => node.textContent?.trim())).toEqual([
            "mine: Hello",
            "theirs: Hi"
        ]);
        expect(element.querySelector(".attachment")?.textContent?.trim()).toBe("a.txt true");
        expect(element.querySelector(".empty")).toBeNull();
        element.remove();
    });
});
