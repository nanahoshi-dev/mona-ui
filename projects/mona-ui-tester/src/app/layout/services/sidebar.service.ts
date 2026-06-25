import { Injectable, signal } from "@angular/core";

@Injectable({
    providedIn: "root"
})
export class SidebarService {
    public readonly isOpen = signal(false);

    public close(): void {
        this.isOpen.set(false);
    }

    public open(): void {
        this.isOpen.set(true);
    }

    public toggle(): void {
        this.isOpen.update(value => !value);
    }
}
