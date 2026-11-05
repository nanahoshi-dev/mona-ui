import { type ComponentRef, signal, type WritableSignal } from "@angular/core";
import { Subject } from "rxjs";
import type { NotificationOptions } from "./NotificationOptions";
import type { NotificationPosition } from "./NotificationPosition";
import type { NotificationRef } from "./NotificationRef";
import type { NotificationType } from "./NotificationType";

/** Options with the defaults `NotificationService.show()` fills in. */
export interface ResolvedNotificationOptions extends NotificationOptions {
    readonly id: string;
    readonly position: NotificationPosition;
    readonly type: NotificationType;
}

/**
 * The internal state of one shown notification, shared by the service and the notification component.
 * Closing has two steps: `close()` starts it and the component plays its leave animation, then `finish()` removes it.
 */
export class NotificationData {
    readonly #afterHide$ = new Subject<void>();
    readonly #onFinish: (data: NotificationData) => void;
    #finished = false;
    public readonly closing = signal(false);
    public readonly contentComponentRef = signal<ComponentRef<unknown> | null>(null);
    public readonly options: WritableSignal<ResolvedNotificationOptions>;
    public readonly ref: NotificationRef;
    /** Set once the notification component exists, so closing waits for its leave animation. */
    public rendered = false;

    public constructor(
        options: ResolvedNotificationOptions,
        onFinish: (data: NotificationData) => void = () => undefined
    ) {
        this.#onFinish = onFinish;
        this.options = signal(options);
        const contentComponentRef = this.contentComponentRef;
        this.ref = {
            afterHide: this.#afterHide$.asObservable(),
            get content() {
                return contentComponentRef();
            },
            hide: () => this.close(),
            id: options.id,
            update: changes => {
                if (!this.#finished) {
                    this.options.update(current => ({ ...current, ...changes }));
                }
            }
        };
    }

    public get finished(): boolean {
        return this.#finished;
    }

    public get id(): string {
        return this.options().id;
    }

    /** Starts closing. A notification that hasn't rendered yet is removed at once. */
    public close(): void {
        if (this.#finished || this.closing()) {
            return;
        }
        if (!this.rendered) {
            this.finish();
            return;
        }
        this.closing.set(true);
    }

    /** Removes the notification, and emits and completes `afterHide`. */
    public finish(): void {
        if (this.#finished) {
            return;
        }
        this.#finished = true;
        this.closing.set(true);
        this.#onFinish(this);
        this.#afterHide$.next();
        this.#afterHide$.complete();
    }
}
