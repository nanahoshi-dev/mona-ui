import { describe, expect, it } from "vitest";
import type { ChatMessage } from "../models/ChatMessage";
import type { ChatUser } from "../models/ChatUser";
import { buildChatDays, chatDayLabel, chatMessageKey } from "../utils/chat-entries";

const ME: ChatUser = { id: "me", name: "Sam Lee" };
const ANA: ChatUser = { id: "ana", name: "Ana" };
const NOW = new Date(2026, 10, 20, 15, 0);
const OPTIONS = {
    locale: "en-US",
    now: NOW,
    timeFormat: { hour: "numeric", minute: "2-digit" },
    userId: "me"
} as const;

function at(day: number, hour: number, minute: number): Date {
    return new Date(2026, 10, day, hour, minute);
}

describe("chat entries", () => {
    it("labels today and yesterday in the locale, with a capital, and other days by their date", () => {
        expect(chatDayLabel(at(20, 9, 0), NOW, "en-US")).toBe("Today");
        expect(chatDayLabel(at(19, 23, 59), NOW, "en-US")).toBe("Yesterday");
        expect(chatDayLabel(at(19, 8, 0), NOW, "de-DE")).toBe("Gestern");
        expect(chatDayLabel(at(16, 8, 0), NOW, "en-US")).toBe("Monday, November 16");
        expect(chatDayLabel(new Date(2025, 11, 31), NOW, "en-US")).toBe("Wednesday, December 31, 2025");
    });

    it("splits the messages by day, and each day into runs of one author's messages", () => {
        const messages: ChatMessage[] = [
            { author: ANA, id: 1, text: "Hi", timestamp: at(19, 18, 0) },
            { author: ANA, id: 2, text: "Are you there?", timestamp: at(19, 18, 2) },
            { author: ME, id: 3, text: "Yes", timestamp: at(20, 9, 0) },
            { author: ME, id: 4, text: "Sorry", timestamp: at(20, 9, 1) },
            { author: ANA, id: 5, text: "No worries", timestamp: at(20, 9, 3) }
        ];
        const days = buildChatDays(messages, OPTIONS);

        expect(days.map(day => [day.label, day.dateTime])).toEqual([
            ["Yesterday", "2026-11-19"],
            ["Today", "2026-11-20"]
        ]);
        expect(days.map(day => day.runs.map(run => run.entries.map(entry => entry.key)))).toEqual([
            [[1, 2]],
            [[3, 4], [5]]
        ]);
        expect(days[1].runs.map(run => run.mine)).toEqual([true, false]);
        expect(days[1].runs[0].timeText).toBe("9:01 AM");
        expect(days[1].runs[0].dateTime).toMatch(/^2026-11-20T09:01:00(?:Z|[+-]\d{2}:\d{2})$/);
    });

    it("starts a new run after five minutes, and a new day's run with its first message", () => {
        const messages: ChatMessage[] = [
            { author: ANA, id: 1, text: "One", timestamp: at(20, 9, 0) },
            { author: ANA, id: 2, text: "Two", timestamp: at(20, 9, 5) },
            { author: ANA, id: 3, text: "Three", timestamp: at(20, 9, 11) }
        ];

        expect(buildChatDays(messages, OPTIONS)[0].runs.map(run => run.entries.length)).toEqual([2, 1]);
    });

    it("puts a message without a time in the day and run before it, and leaves earlier ones unlabeled", () => {
        const messages: ChatMessage[] = [
            { author: ANA, id: 1, text: "Undated" },
            { author: ANA, id: 2, text: "Dated", timestamp: at(20, 9, 0) },
            { author: ANA, id: 3, text: "Undated too" },
            { author: ME, id: 4, text: "Mine", timestamp: new Date(Number.NaN) }
        ];
        const days = buildChatDays(messages, OPTIONS);

        expect(days.map(day => day.label)).toEqual(["", "Today"]);
        expect(days[1].runs.map(run => run.entries.map(entry => entry.key))).toEqual([[2, 3], [4]]);
        expect(days[1].runs[0].timeText).toBe("9:00 AM");
        expect(days[1].runs[1].timeText).toBe("");
    });

    it("keys a message by its id, or by itself without one", () => {
        const message: ChatMessage = { author: ANA, text: "Hi" };

        expect(chatMessageKey({ ...message, id: 0 })).toBe(0);
        expect(chatMessageKey(message)).toBe(message);
    });
});
