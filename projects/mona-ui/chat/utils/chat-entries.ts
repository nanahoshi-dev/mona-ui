import { formatGregorianDateToLocaleString } from "@nanahoshi/mona-ui/i18n";
import { DateTime } from "luxon";
import type { ChatAttachment, ChatMessage } from "../models/ChatMessage";
import type { ChatUser } from "../models/ChatUser";

/** Messages from one author, this close together, share a run: one name, one avatar and one time. */
export const CHAT_RUN_GAP_MS = 5 * 60 * 1000;

/** A message as the chat shows it. */
export interface ChatEntry {
    readonly attachments: readonly ChatAttachment[];
    /** What identifies the message: its `id`, or the message itself without one. */
    readonly key: unknown;
    readonly message: ChatMessage;
    readonly mine: boolean;
}

/** Messages from one author in a row, sent close together. */
export interface ChatRun {
    readonly author: ChatUser;
    /** The `datetime` of the last message's time, or `null` when it has none. */
    readonly dateTime: string | null;
    readonly entries: readonly ChatEntry[];
    readonly key: unknown;
    readonly mine: boolean;
    /** The last message's time, as the run shows it under its messages. */
    readonly timeText: string;
}

/** The runs of messages sent on one day, under the day's label. */
export interface ChatDay {
    /** The day as a date, `"2026-11-20"`, or `null` for messages before any with a time. */
    readonly dateTime: string | null;
    readonly key: string;
    /** "Today", "Yesterday", or the date. Empty for messages before any with a time. */
    readonly label: string;
    readonly runs: readonly ChatRun[];
}

export interface ChatDaysOptions {
    readonly locale: string;
    /** The moment the days are labeled from: what "Today" is. */
    readonly now: Date;
    readonly timeFormat: Intl.DateTimeFormatOptions;
    /** The user's `id`, which makes a message theirs. */
    readonly userId: unknown;
}

/** A message's key: its `id`, or the message itself without one. */
export function chatMessageKey(message: ChatMessage): unknown {
    return message.id ?? message;
}

/**
 * The day's label: "Today" or "Yesterday" in the locale, from `Intl.RelativeTimeFormat`, with a capital, or the date,
 * with the year when it isn't this year's.
 */
export function chatDayLabel(date: Date, now: Date, locale: string): string {
    const days = DateTime.fromJSDate(date).startOf("day").diff(DateTime.fromJSDate(now).startOf("day"), "days").days;
    const offset = Math.round(days);
    if (Math.abs(offset) <= 1) {
        const text = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(offset, "day");
        return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
    }
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", weekday: "long" };
    if (date.getFullYear() !== now.getFullYear()) {
        return formatGregorianDateToLocaleString(date, locale, { ...options, year: "numeric" });
    }
    return formatGregorianDateToLocaleString(date, locale, options);
}

/**
 * Lays the messages out by day, and within a day in runs: messages from one author in a row, each sent within five
 * minutes of the one before. A message without a time joins the day and the run before it.
 */
export function buildChatDays(messages: readonly ChatMessage[], options: ChatDaysOptions): ChatDay[] {
    const days: { dateTime: string | null; key: string; label: string; runs: MutableRun[] }[] = [];
    let previous: ChatMessage | null = null;
    for (const message of messages) {
        const timestamp = validDate(message.timestamp);
        const dayKey = timestamp == null ? null : DateTime.fromJSDate(timestamp).toISODate();
        let day = days.at(-1);
        if (day == null || (dayKey != null && day.key !== dayKey)) {
            day = {
                dateTime: dayKey,
                key: dayKey ?? "",
                label: timestamp == null ? "" : chatDayLabel(timestamp, options.now, options.locale),
                runs: []
            };
            days.push(day);
            previous = null;
        }
        const entry: ChatEntry = {
            attachments: message.attachments ?? [],
            key: chatMessageKey(message),
            message,
            mine: message.author.id === options.userId
        };
        let run = day.runs.at(-1);
        if (run == null || previous == null || !continuesRun(previous, message)) {
            run = {
                author: message.author,
                dateTime: null,
                entries: [],
                key: entry.key,
                mine: entry.mine,
                timeText: ""
            };
            day.runs.push(run);
        }
        run.entries.push(entry);
        // The run's time is its last message's that has one.
        if (timestamp != null) {
            run.dateTime = DateTime.fromJSDate(timestamp).toISO({ suppressMilliseconds: true });
            run.timeText = formatGregorianDateToLocaleString(timestamp, options.locale, options.timeFormat);
        }
        previous = message;
    }
    return days;
}

/** A run while its day is laid out. */
interface MutableRun {
    readonly author: ChatUser;
    dateTime: string | null;
    readonly entries: ChatEntry[];
    readonly key: unknown;
    readonly mine: boolean;
    timeText: string;
}

function continuesRun(previous: ChatMessage, message: ChatMessage): boolean {
    if (previous.author.id !== message.author.id) {
        return false;
    }
    const before = validDate(previous.timestamp);
    const after = validDate(message.timestamp);
    return before == null || after == null || after.getTime() - before.getTime() <= CHAT_RUN_GAP_MS;
}

function validDate(value: Date | undefined): Date | null {
    return value instanceof Date && Number.isFinite(value.getTime()) ? value : null;
}
