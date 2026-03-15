import { ApplicationRef, ComponentRef, createComponent, DOCUMENT, inject, Injectable, signal } from "@angular/core";
import { Subject, Subscription, take } from "rxjs";
import { v4 } from "uuid";
import { NotificationContainerComponent } from "../components/notification-container/notification-container.component";
import { NotificationContainerData } from "../models/NotificationContainerData";
import { NotificationData } from "../models/NotificationData";
import { NotificationOptions } from "../models/NotificationOptions";
import { NotificationPosition } from "../models/NotificationPosition";
import { NotificationRef } from "../models/NotificationRef";
import { NotificationType } from "../models/NotificationType";

@Injectable({
    providedIn: "root"
})
export class NotificationService {
    readonly #appRef = inject(ApplicationRef);
    readonly #document = inject(DOCUMENT);
    private notificationContainerMap: Map<NotificationPosition, NotificationContainerData> = new Map<
        NotificationPosition,
        NotificationContainerData
    >();
    private notificationContainerSubscriptions: Record<NotificationPosition, Subscription | null> = {
        bottom: null,
        bottomleft: null,
        bottomright: null,
        top: null,
        topleft: null,
        topright: null
    };

    public constructor() {
        this.initialize();
    }

    private static getDefaultTitle(type: NotificationType): string {
        switch (type) {
            case "info":
                return "Info";
            case "success":
                return "Success";
            case "warning":
                return "Warning";
            case "error":
                return "Error";
        }
    }

    public close(id: string): void {
        const notificationData = this.getNotificationDataById(id);
        if (notificationData) {
            notificationData.componentDestroy$.next(id);
        }
    }

    public show(options: NotificationOptions): NotificationRef {
        if (!options.id) {
            options.id = `Notification_${v4()}`;
        }
        if (!options.position) {
            options.position = "topright";
        }
        if (!options.type) {
            options.type = "info";
        }
        if (!options.title) {
            options.title = NotificationService.getDefaultTitle(options.type);
        }
        const containerData: NotificationContainerData | undefined = this.notificationContainerMap.get(
            options.position
        );
        if (containerData?.notifications.has(options.id)) {
            const existing = containerData.notifications.get(options.id)!;
            return {
                afterHide: existing.afterHide$.asObservable(),
                get content() {
                    return existing.contentComponentRef();
                },
                hide: () => this.close(options.id as string)
            };
        }
        if (this.notificationContainerSubscriptions[options.position as NotificationPosition]) {
            return this.createNotification(options);
        } else {
            return this.createNotificationContainer(options);
        }
    }

    private createContainerComponent(): Subject<ComponentRef<NotificationContainerComponent>> {
        const containerSubject = new Subject<ComponentRef<NotificationContainerComponent>>();
        const notificationContainerComponent = createComponent(NotificationContainerComponent, {
            environmentInjector: this.#appRef.injector
        });
        this.#document.body.appendChild(notificationContainerComponent.location.nativeElement);
        this.#appRef.attachView(notificationContainerComponent.hostView);
        notificationContainerComponent.changeDetectorRef.detectChanges();
        window.setTimeout(() => {
            containerSubject.next(notificationContainerComponent);
        });
        return containerSubject;
    }

    private createNotification(options: NotificationOptions): NotificationRef {
        const position = options.position as NotificationPosition;
        const notificationContainerData: NotificationContainerData | undefined =
            this.notificationContainerMap.get(position);
        if (!notificationContainerData) {
            throw new Error(`Notification container for position ${position} was not found.`);
        }
        const componentDestroy$ = new Subject<string>();
        const afterHide$ = new Subject<void>();
        const notificationData: NotificationData = {
            options,
            componentDestroy$,
            afterHide$,
            contentComponentRef: signal(null)
        };
        if (!notificationContainerData.notifications.has(options.id as string)) {
            notificationContainerData.notifications.set(options.id as string, notificationData);
            if (notificationContainerData.componentRef) {
                notificationContainerData.componentRef.instance.notificationDataList.set(
                    Array.from(notificationContainerData.notifications.values())
                );
            }
        }
        componentDestroy$.pipe(take(1)).subscribe(id => {
            afterHide$.next();
            afterHide$.complete();
            this.removeNotificationData(id, position);
        });
        return {
            afterHide: afterHide$.asObservable(),
            get content() {
                return notificationData.contentComponentRef();
            },
            hide: () => this.close(options.id as string)
        };
    }

    private createNotificationContainer(options: NotificationOptions): NotificationRef {
        const position = options.position as NotificationPosition;
        const ref = this.createNotification(options);
        this.notificationContainerSubscriptions[position] = this.createContainerComponent().subscribe(ncr => {
            ncr.instance.position.set(options.position as NotificationPosition);
            const notificationContainerData = this.notificationContainerMap.get(position) as NotificationContainerData;
            notificationContainerData.componentRef = ncr;
            notificationContainerData.subscription = this.notificationContainerSubscriptions[position] as Subscription;
            ncr.instance.notificationDataList.set(Array.from(notificationContainerData.notifications.values()));
        });
        return ref;
    }

    private getNotificationDataById(id: string): NotificationData | null {
        for (const notificationContainerData of this.notificationContainerMap.values()) {
            const notificationData = notificationContainerData.notifications.get(id);
            if (notificationData) {
                return notificationData;
            }
        }
        return null;
    }

    private initialize(): void {
        this.notificationContainerMap.set("bottom", {
            componentRef: null,
            notifications: new Map<string, NotificationData>()
        });
        this.notificationContainerMap.set("bottomleft", {
            componentRef: null,
            notifications: new Map<string, NotificationData>()
        });
        this.notificationContainerMap.set("bottomright", {
            componentRef: null,
            notifications: new Map<string, NotificationData>()
        });
        this.notificationContainerMap.set("top", {
            componentRef: null,
            notifications: new Map<string, NotificationData>()
        });
        this.notificationContainerMap.set("topleft", {
            componentRef: null,
            notifications: new Map<string, NotificationData>()
        });
        this.notificationContainerMap.set("topright", {
            componentRef: null,
            notifications: new Map<string, NotificationData>()
        });
    }

    private removeNotificationData(id: string, position: NotificationPosition): void {
        const container = this.notificationContainerMap.get(position);
        if (!container) {
            return;
        }
        container.notifications.delete(id);
        if (container.componentRef) {
            container.componentRef.instance.notificationDataList.set(
                Array.from(container.notifications.values())
            );
        }
        if (container.notifications.size === 0) {
            container.subscription?.unsubscribe();
            const componentRefToDestroy = container.componentRef;
            container.componentRef = null;
            container.subscription = undefined;
            this.notificationContainerSubscriptions[position] = null;
            window.setTimeout(() => {
                if (componentRefToDestroy) {
                    this.#appRef.detachView(componentRefToDestroy.hostView);
                    componentRefToDestroy.destroy();
                }
            }, 300);
        }
    }
}
