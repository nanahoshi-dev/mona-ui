import { assertInInjectionContext, inject, Injectable, Injector, signal, WritableSignal } from "@angular/core";
import { ComponentConfigTemplateItem } from "./componentConfig";

@Injectable()
export class TemplateConfigHandler {
    readonly #data = signal<ComponentConfigTemplateItem>({});

    public updateData(data: ComponentConfigTemplateItem): void {
        this.#data.set(data);
    }

    public updateProperty<K extends keyof ComponentConfigTemplateItem>(property: K, value: boolean): void {
        const currentData = this.#data();
        if (currentData) {
            const updatedData: ComponentConfigTemplateItem = {
                ...currentData,
                [property]: {
                    ...currentData[property],
                    active: value
                }
            };
            this.#data.set(updatedData);
        }
    }

    public get data(): WritableSignal<ComponentConfigTemplateItem> {
        return this.#data;
    }
}

export const createTemplateInjector = (
    initialData: ComponentConfigTemplateItem,
    parentInjector?: Injector
): Injector => {
    let contextInjector = parentInjector;
    if (!contextInjector) {
        assertInInjectionContext(createTemplateInjector);
        contextInjector = inject(Injector);
    }

    const handler = new TemplateConfigHandler();
    handler.updateData(initialData);

    return Injector.create({
        parent: contextInjector,
        providers: [
            {
                provide: TemplateConfigHandler,
                useValue: handler
            }
        ]
    });
};
