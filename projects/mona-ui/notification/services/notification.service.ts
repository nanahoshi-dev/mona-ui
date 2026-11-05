import { Directionality } from "@angular/cdk/bidi";
import {
    ApplicationRef,
    type ComponentRef,
    createComponent,
    DestroyRef,
    DOCUMENT,
    inject,
    Injectable,
    type ViewContainerRef
} from "@angular/core";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { NotificationContainerComponent } from "../components/notification-container/notification-container.component";
import { NotificationData, type ResolvedNotificationOptions } from "../models/NotificationData";
import type { NotificationOptions } from "../models/NotificationOptions";
import type { NotificationPosition } from "../models/NotificationPosition";
import type { NotificationRef } from "../models/NotificationRef";
import { NOTIFICATION_DEFAULTS } from "../tokens/notification.tokens";

interface NotificationContainer {
    readonly componentRef: ComponentRef<NotificationContainerComponent>;
    readonly notifications: Map<string, NotificationData>;
}

@Injectable({
    providedIn: "root"
})
export class NotificationService {
    readonly #appRef = inject(ApplicationRef);
    readonly #containers = new Map<NotificationPosition, NotificationContainer>();
    readonly #defaults = inject(NOTIFICATION_DEFAULTS);
    readonly #directionality = inject(Directionality, { optional: true });
    readonly #document = inject(DOCUMENT);
    readonly #i18n = inject(MonaI18nService, { optional: true });
    #destroyed = false;

    public constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.#destroyed = true;
            for (const container of this.#containers.values()) {
                this.#destroyContainer(container);
            }
            this.#containers.clear();
        });
    }

    public hide(id: string): void {
        for (const container of this.#containers.values()) {
            container.notifications.get(id)?.close();
        }
    }

    public hideAll(): void {
        for (const container of [...this.#containers.values()]) {
            for (const notification of [...container.notifications.values()]) {
                notification.close();
            }
        }
    }

    public show(options: NotificationOptions): NotificationRef {
        const position = options.position ?? "topright";
        const id = options.id ?? createElementControlId();
        const existing = this.#containers.get(position)?.notifications.get(id);
        if (existing && !existing.finished) {
            return existing.ref;
        }
        const duration =
            options.duration != null && this.#defaults.autoHide
                ? options.duration * this.#defaults.durationScale
                : undefined;
        const resolved: ResolvedNotificationOptions = {
            ...options,
            closable: options.closable ?? true,
            duration,
            id,
            position,
            type: options.type ?? "info"
        };
        const container = this.#containers.get(position) ?? this.#createContainer(position, options.appendTo);
        const data = new NotificationData(resolved, finished => this.#remove(position, finished));
        container.notifications.set(id, data);
        this.#limit(container);
        this.#sync(container);
        return data.ref;
    }

    #createContainer(position: NotificationPosition, appendTo: ViewContainerRef | undefined): NotificationContainer {
        // Created and attached at once, so a notification hidden in the same tick never leaves a container behind.
        const componentRef = createComponent(NotificationContainerComponent, {
            environmentInjector: this.#appRef.injector
        });
        const element: HTMLElement = componentRef.location.nativeElement;
        const host: HTMLElement = appendTo ? appendTo.element.nativeElement : this.#document.body;
        componentRef.instance.position.set(position);
        componentRef.instance.positionType.set(appendTo ? "absolute" : "fixed");
        if (!appendTo) {
            // The container sits outside the app root, so it takes the app's direction and language explicitly.
            element.setAttribute("dir", this.#directionality?.value ?? "ltr");
            const lang = this.#i18n?.localeId();
            if (lang) {
                element.setAttribute("lang", lang);
            }
        }
        host.appendChild(element);
        this.#appRef.attachView(componentRef.hostView);
        componentRef.changeDetectorRef.detectChanges();
        const container: NotificationContainer = { componentRef, notifications: new Map() };
        this.#containers.set(position, container);
        return container;
    }

    #destroyContainer(container: NotificationContainer): void {
        const { componentRef } = container;
        if (!componentRef.hostView.destroyed) {
            componentRef.destroy();
        }
        componentRef.location.nativeElement.remove();
    }

    /** Closes the oldest notifications beyond `maxVisible`. */
    #limit(container: NotificationContainer): void {
        const max = this.#defaults.maxVisible;
        if (max == null || max < 1) {
            return;
        }
        const open = [...container.notifications.values()].filter(notification => !notification.closing());
        for (const notification of open.slice(0, Math.max(0, open.length - max))) {
            notification.close();
        }
    }

    #remove(position: NotificationPosition, data: NotificationData): void {
        const container = this.#containers.get(position);
        if (this.#destroyed || !container || container.notifications.get(data.id) !== data) {
            return;
        }
        container.notifications.delete(data.id);
        if (container.notifications.size === 0) {
            this.#containers.delete(position);
            this.#destroyContainer(container);
            return;
        }
        this.#sync(container);
    }

    #sync(container: NotificationContainer): void {
        container.componentRef.instance.notificationDataList.set([...container.notifications.values()]);
    }
}
