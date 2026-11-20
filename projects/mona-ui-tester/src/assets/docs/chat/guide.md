## Overview

Give the chat the user and the messages, and add a message to them whenever the user sends one or a reply comes in. The chat lays them out, keeps the newest in view, and tells screen readers about each new one.

**Use Chat when:**

- People write to each other in turns: support conversations, comments on a task, direct messages.
- Users ask an assistant questions and read its answers as they stream in.

For a list of comments that aren't a back-and-forth, use a [list view](/components/list-view). For short status messages that come and go, use a [notification](/components/notification).

## Import & Quick Start

```typescript
import { ChatComponent } from "@nanahoshi/mona-ui/chat";
```

```html
<mona-chat aria-label="Chat with Ana Silva" [messages]="messages()" [user]="me" (send)="onSend($event)" />
```

```typescript
protected readonly ana: ChatUser = { id: "ana", name: "Ana Silva" };
protected readonly me: ChatUser = { id: "me", name: "Sam Lee" };
protected readonly messages = signal<readonly ChatMessage[]>([
    { author: this.ana, id: 1, text: "Lunch on Friday?", timestamp: new Date(2026, 10, 20, 12, 0) }
]);

protected onSend(event: ChatSendEvent): void {
    this.messages.update(messages => [
        ...messages,
        { author: this.me, id: crypto.randomUUID(), text: event.text, timestamp: new Date() }
    ]);
}
```

A message whose author has the user's `id` is the user's own. Give each message an `id` too, so a copy that replaces it, as when its status changes or a reply streams in, stays the same message.

## Anatomy

| Directive | Selector | Replaces |
| --- | --- | --- |
| `ChatMessageTemplateDirective` | `ng-template[monaChatMessageTemplate]` | A message's text, inside its bubble |
| `ChatAttachmentTemplateDirective` | `ng-template[monaChatAttachmentTemplate]` | A file's picture, name and size |
| `ChatEmptyTemplateDirective` | `ng-template[monaChatEmptyTemplate]` | "No messages yet" |

The message template's context is the message (`let-message`) and whether it's the user's own (`let-mine="mine"`). The attachment template's is the file (`let-attachment`), its message (`let-message="message"`) and `mine`. A message's files, its status and the caret of a reply that's streaming stay where they are around a message template.

Each message is a `ChatMessage`:

| Field | Shows |
| --- | --- |
| `author` | Who sent it: a `ChatUser`, with an `id`, a `name` and an optional `avatarUrl` |
| `text` | What it says, with its line breaks |
| `timestamp` | When it was sent: the day above the day's first message, and the time under each run |
| `attachments` | Files sent with it, each with a `name`, and an optional `size`, `type` and `url` |
| `status` | For the user's own: `"sending"`, `"sent"` or `"failed"` |
| `streaming` | Whether its text is still coming in |

## Examples

### A conversation

Ana answers each message after a moment, and the chat shows that she's typing while she does. Messages from the same person within five minutes of each other share a run: one name and avatar beside them, and one time below.

```example
chat/basic
```

### Files and failed messages

With `allowFiles`, the paperclip button attaches files, and `accept` limits which ones the picker offers. The files go out with the message in `send`. This example shows the message as sending, then as sent, or as not sent when a file is over 1 MB. Retry emits `retry` with the message, to send it again.

```example
chat/files
```

### An assistant

The empty template greets the user, and the suggested replies give them questions to start with. Each answer streams in a word at a time, with a caret at its end and Stop in place of Send. The message template shows lines that start with "- " as a list.

```example
chat/assistant
```

## Appearance & Styling

The chat has the surface and border of a card, and is 32rem tall by default. Set its height with a class, such as `class="h-96"`. The messages scroll inside it, and the message box stays at the bottom.

The user's bubbles are in the primary color, and others' in the muted surface color. Each run is at most 36rem wide, or 85% of the chat's width when that's narrower. A message that's sending is faded, and one that failed has "Not sent" and Retry under it in the error color.

In forced colors, each bubble has a border in the system's text color, as its fill isn't painted, and the caret and the typing dots are drawn in the text color too. For users who prefer reduced motion, the caret doesn't blink and the typing dots don't bounce.

## Behavior

### Sending

Enter sends the message, and Shift+Enter starts a new line. An Enter that picks a word in an input method's composition, as in Japanese or Chinese, doesn't send. The message box grows with its text, up to 15rem, then scrolls.

`send` emits the text, trimmed, and the files. A message needs text or a file: the Send button is disabled until it has one, and while the chat is `disabled`. After sending, the box is cleared and keeps focus. Pressing a suggested reply sends its text the same way.

`draft` is the text in the box. Bind it two-way, `[(draft)]`, to keep a draft for each conversation, or to tell others that the user is typing.

### Days and runs

The chat puts the day above its first message: "Today", "Yesterday", or the date, in the locale, with the year when it isn't this year. A run of one author's messages gets one time below it, formatted with `timeFormat`. A message without a `timestamp` joins the day and run before it.

### Scrolling

The chat opens at the newest message, and keeps to it as messages arrive and the message box grows, while the user is reading there. Once they've scrolled up, new messages from others don't move what they're reading: a New messages button appears, and takes them to the bottom. A message the user sends always takes them there.

### Streaming replies

While a message's `streaming` is `true`, it shows a caret at the end of its text, the Send button becomes Stop, and the suggested replies are hidden. Replace the message with a copy that has more text as each part comes in, and set `streaming` to `false` when it's done. Stop emits `stop`; end the reply there.

### Typing

`typing` holds the people typing. The chat names up to three, joined in the locale's way, as in "Ana and Ben are typing", and counts more, as in "4 people are typing". Leave the user out of it: the row is for others.

## Accessibility

The messages are a log, named by the chat's `aria-label`, or "Messages" in the locale. The log is a Tab stop, so keyboard users can scroll it with the arrow keys.

Screen readers hear each new message from someone else once, as "Ana Silva: Lunch on Friday?", politely, after what they're reading. A reply that streams in is announced once it's done, not word by word, which is why the log itself isn't live. The user's own messages and the ones shown at first aren't announced. Nor is the typing row, which changes often; it's there to read.

Each run starts with its author's name, which for the user's own is "You", read but not shown. Avatars are hidden from screen readers, as the name is beside them. A day and a time are each in a `<time>` element, with the date in ISO 8601 in its `datetime`.

The message box, the attach button, each file's remove button, Send and Stop are named in the locale. A picture sent as a file has an empty `alt`, as its name is below it; to describe pictures, give the chat an attachment template.

### Keyboard

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Moves focus through the messages, the Retry and New messages buttons, the suggested replies, and the message box and its buttons |
| `ArrowUp` / `ArrowDown` | Scrolls the focused messages |
| `Enter` | In the message box, sends the message; on a button, presses it |
| `Shift+Enter` | In the message box, starts a new line |

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `role` | On the messages | `"log"` |
| `aria-label` | On the messages | The chat's `aria-label`, or "Messages" in the locale |
| `aria-live` | On the messages | `"off"`: the chat announces new messages itself |
| `tabindex` | On the messages | `"0"` |
| `aria-busy` | On a message's bubble, while it streams | `"true"` |
| `role` / `aria-label` | On the suggested replies | `"group"` and "Suggested replies" in the locale |
| `aria-label` | On the message box, and the attach, remove, Send and Stop buttons | Their names in the locale |
| `aria-hidden` | On avatars, the caret and the typing dots | `"true"` |
