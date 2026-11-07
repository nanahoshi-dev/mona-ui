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

    /** Marks the event as prevented, keeping the dialog open. */
    public preventDefault(): void {
        this.#defaultPrevented = true;
    }

    /** Inherited from `PreventableEvent`. */
    public get originalEvent(): E | undefined {
        return this.#event;
    }

    /** Inherited from `PreventableEvent`. */
    public get type(): string | undefined {
        return this.#type;
    }
}
