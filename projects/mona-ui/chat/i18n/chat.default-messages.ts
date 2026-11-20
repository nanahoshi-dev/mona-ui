// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaChatMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

export const CHAT_DEFAULT_MESSAGES: MonaChatMessages = {
    attachFiles: "Attach files",
    messageBox: "Message",
    messages: "Messages",
    newMessage: (name: string, text: string) => `${name}: ${text}`,
    newMessages: "New messages",
    noMessages: "No messages yet",
    notSent: "Not sent",
    placeholder: "Type a message",
    removeFile: (name: string) => `Remove ${name}`,
    retry: "Retry",
    send: "Send",
    sending: "Sending",
    stop: "Stop",
    suggestions: "Suggested replies",
    typing: (names: string, count: number) => (count === 1 ? `${names} is typing` : `${names} are typing`),
    typingMany: (count: number) =>
        count === 1 ? `${localizeNumber(count)} person is typing` : `${localizeNumber(count)} people are typing`,
    you: "You"
};
