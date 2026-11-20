import { NgComponentOutlet } from "@angular/common";
import { Component, computed } from "@angular/core";
import type { ChatComponent, ChatUser } from "@nanahoshi/mona-ui/chat";
import type { ComponentConfig } from "../../utils/componentConfig";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { ChatDemoConversationComponent } from "./chat-demo-conversation.component";

const SUGGESTION_CHOICES: readonly { readonly text: string; readonly value: readonly string[] }[] = [
    { text: "None", value: [] },
    { text: "Two replies", value: ["Sounds good!", "Can we make it one o'clock?"] },
    { text: "Four replies", value: ["Sounds good!", "Can we make it one o'clock?", "I'll be late", "Count me out"] }
];

const PEOPLE: readonly ChatUser[] = [
    { id: "ana", name: "Ana Silva" },
    { id: "ben", name: "Ben Okafor" },
    { id: "kim", name: "Kim Park" },
    { id: "lea", name: "Léa Martin" }
];

const TYPING_CHOICES: readonly { readonly text: string; readonly value: readonly ChatUser[] }[] = [
    { text: "Nobody", value: [] },
    { text: "One person", value: PEOPLE.slice(0, 1) },
    { text: "Two people", value: PEOPLE.slice(0, 2) },
    { text: "Four people", value: PEOPLE }
];

const TIME_FORMAT_CHOICES: readonly { readonly text: string; readonly value: Intl.DateTimeFormatOptions }[] = [
    { text: "Hours and minutes", value: { hour: "numeric", minute: "2-digit" } },
    { text: "24-hour", value: { hour: "2-digit", hourCycle: "h23", minute: "2-digit" } },
    { text: "With seconds", value: { timeStyle: "medium" } }
];

@Component({
    selector: "app-chat-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./chat-demo.component.html"
})
export class ChatDemoComponent extends AbstractDemoComponent<ChatComponent> {
    protected readonly config = computed<ComponentConfig<ChatComponent>>(() => ({
        inputs: deriveInputConfig<ChatComponent>(this.metadata(), {
            // The conversation is fixed, so its name, messages, user and draft are too.
            accept: undefined,
            ariaLabel: undefined,
            draft: undefined,
            suggestions: {
                type: "customDropdown",
                value: SUGGESTION_CHOICES,
                textField: "text",
                valueField: "value",
                defaultValue: SUGGESTION_CHOICES[0].value
            },
            timeFormat: {
                type: "customDropdown",
                value: TIME_FORMAT_CHOICES,
                textField: "text",
                valueField: "value",
                defaultValue: TIME_FORMAT_CHOICES[0].value
            },
            typing: {
                type: "customDropdown",
                value: TYPING_CHOICES,
                textField: "text",
                valueField: "value",
                defaultValue: TYPING_CHOICES[0].value
            },
            userClass: {
                alias: "class",
                type: "string",
                value: ""
            }
        })
    }));
    protected readonly metadata = this.getMetadata("ChatComponent");
    protected readonly wrapperComponent = ChatDemoConversationComponent;
}
