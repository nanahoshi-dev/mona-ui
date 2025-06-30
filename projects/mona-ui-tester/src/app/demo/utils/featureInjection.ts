import { assertInInjectionContext, inject, Injectable, Injector, signal, WritableSignal } from "@angular/core";
import { ComponentConfigFeatureItem } from "./componentConfig";

@Injectable()
export class FeatureConfigHandler {
    readonly #data = signal<ComponentConfigFeatureItem>({});

    public updateData(data: ComponentConfigFeatureItem): void {
        this.#data.set(data);
    }

    public updateProperty<K extends keyof ComponentConfigFeatureItem>(property: K, value: boolean): void {
        const currentData = this.#data();
        if (currentData) {
            const updatedData: ComponentConfigFeatureItem = {
                ...currentData,
                [property]: {
                    ...currentData[property],
                    active: value
                }
            };
            this.#data.set(updatedData);
        }
    }

    public get data(): WritableSignal<ComponentConfigFeatureItem> {
        return this.#data;
    }
}

export const createFeatureInjector = (initialData: ComponentConfigFeatureItem, parentInjector?: Injector): Injector => {
    let contextInjector = parentInjector;
    if (!contextInjector) {
        assertInInjectionContext(createFeatureInjector);
        contextInjector = inject(Injector);
    }

    const handler = new FeatureConfigHandler();
    handler.updateData(initialData);

    return Injector.create({
        parent: contextInjector,
        providers: [
            {
                provide: FeatureConfigHandler,
                useValue: handler
            }
        ]
    });
};
