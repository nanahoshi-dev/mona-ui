export interface MonaChatMessages {
    /** Names the button that opens the file picker to attach files to a message. */
    readonly attachFiles: string;

    /** Names the message box. */
    readonly messageBox: string;

    /** Names the list of messages, when the chat has no name of its own. */
    readonly messages: string;

    /**
     * Announces a message from someone else as it arrives, or once it has finished streaming: who sent it and what it
     * says ("Ana: See you at six").
     */
    newMessage(name: string, text: string): string;

    /** Labels the button that scrolls to messages that arrived while the user was reading earlier ones. */
    readonly newMessages: string;

    /** Shown in a chat with no messages. */
    readonly noMessages: string;

    /** Shown under a message of the user's that couldn't be sent. */
    readonly notSent: string;

    /** The message box's placeholder. */
    readonly placeholder: string;

    /** Names the button that removes a file waiting to be sent ("Remove photo.jpg"). */
    removeFile(name: string): string;

    /** Labels the button that sends a message that couldn't be sent again. */
    readonly retry: string;

    /** Names the button that sends the message. */
    readonly send: string;

    /** Shown under a message of the user's that's being sent. */
    readonly sending: string;

    /** Names the button that stops a reply that's streaming in. */
    readonly stop: string;

    /** Names the group of suggested replies. */
    readonly suggestions: string;

    /**
     * Says who's typing, their names joined in the locale's way ("Ana is typing", "Ana and Ben are typing"), for up to
     * three people.
     */
    typing(names: string, count: number): string;

    /** Says how many people are typing, for more than three ("4 people are typing"). */
    typingMany(count: number): string;

    /** Names the user's own messages to assistive technology, where others' messages have their author's name. */
    readonly you: string;
}
