export class PreventableEvent<E extends Event = Event> {
    readonly #event?: E;
    readonly #type?: string;
    #defaultPrevented: boolean = false;

    public constructor(type?: string, event?: E) {
        this.#type = type;
        this.#event = event;
    }

    /** Whether `preventDefault()` was called. */
    public isDefaultPrevented(): boolean {
        return this.#defaultPrevented;
    }

    /** Cancels what the event announces, such as opening or closing a popup, or closing a dialog. */
    public preventDefault(): void {
        this.#defaultPrevented = true;
    }

    /** The DOM event that caused this one, when there is one. */
    public get originalEvent(): E | undefined {
        return this.#event;
    }

    /** A name for the kind of event, when the component that emits it sets one. */
    public get type(): string | undefined {
        return this.#type;
    }
}
