import { assertInInjectionContext, inject, Injectable, Injector, Signal, signal } from "@angular/core";
import { ComponentConfigFeatureItem, ComponentConfigFeatureItemOptions } from "./componentConfig";

@Injectable()
export class FeatureConfigHandler {
    readonly #data = signal<ComponentConfigFeatureItem>({});

    public updateData(data: ComponentConfigFeatureItem): void {
        this.#data.set(data);
    }

    public updateProperty<K extends keyof ComponentConfigFeatureItem>(
        type: ComponentConfigFeatureItemOptions["type"],
        property: K,
        value: boolean
    ): void {
        const currentData = this.#data();
        if (currentData) {
            let updatedData: ComponentConfigFeatureItem;
            if (type === "boolean") {
                updatedData = {
                    ...currentData,
                    [property]: {
                        ...currentData[property],
                        active: value
                    }
                };
            } else if (type === "number") {
                updatedData = {
                    ...currentData,
                    [property]: {
                        ...currentData[property],
                        numericValue: value
                    }
                };
            } else {
                updatedData = {
                    ...currentData,
                    [property]: {
                        ...currentData[property],
                        dropdownValue: value
                    }
                };
            }
            this.#data.set(updatedData);
        }
    }

    public updateSubFeature(type: ComponentConfigFeatureItemOptions["type"], path: string[], value: unknown): void {
        const currentData = this.#data();
        const [topKey, ...subPath] = path;
        const topItem = currentData[topKey];
        if (!topItem) {
            return;
        }
        this.#data.set({
            ...currentData,
            [topKey]: this.#updateAtPath(type, topItem, subPath, value)
        });
    }

    public get data(): Signal<ComponentConfigFeatureItem> {
        return this.#data.asReadonly();
    }

    #applyValue(
        type: ComponentConfigFeatureItemOptions["type"],
        item: ComponentConfigFeatureItem[string],
        value: unknown
    ): ComponentConfigFeatureItem[string] {
        if (type === "boolean") {
            return { ...item, active: value as boolean };
        }
        if (type === "number") {
            return { ...item, numericValue: value as number };
        }
        if (type === "string") {
            return { ...item, stringValue: value as string };
        }
        return { ...item, dropdownValue: value };
    }

    #updateAtPath(
        type: ComponentConfigFeatureItemOptions["type"],
        item: ComponentConfigFeatureItem[string],
        path: string[],
        value: unknown
    ): ComponentConfigFeatureItem[string] {
        const [key, ...rest] = path;
        if (!item.subFeatures?.[key]) return item;
        const updatedChild =
            rest.length === 0
                ? this.#applyValue(type, item.subFeatures[key], value)
                : this.#updateAtPath(type, item.subFeatures[key], rest, value);
        return {
            ...item,
            subFeatures: { ...item.subFeatures, [key]: updatedChild }
        };
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
