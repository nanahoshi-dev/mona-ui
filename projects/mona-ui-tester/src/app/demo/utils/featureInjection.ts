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

    public updateSubFeature<K extends keyof ComponentConfigFeatureItem>(
        type: ComponentConfigFeatureItemOptions["type"],
        parentProperty: K,
        subProperty: string,
        value: boolean
    ): void {
        const currentData = this.#data();
        if (currentData && currentData[parentProperty] && currentData[parentProperty].subFeatures) {
            let updatedData: ComponentConfigFeatureItem;
            if (type === "boolean") {
                updatedData = {
                    ...currentData,
                    [parentProperty]: {
                        ...currentData[parentProperty],
                        subFeatures: {
                            ...currentData[parentProperty].subFeatures,
                            [subProperty]: {
                                ...currentData[parentProperty].subFeatures![subProperty],
                                active: value
                            }
                        }
                    }
                };
            } else if (type === "number") {
                updatedData = {
                    ...currentData,
                    [parentProperty]: {
                        ...currentData[parentProperty],
                        subFeatures: {
                            ...currentData[parentProperty].subFeatures,
                            [subProperty]: {
                                ...currentData[parentProperty].subFeatures![subProperty],
                                numericValue: value
                            }
                        }
                    }
                };
            } else if (type === "string") {
                updatedData = {
                    ...currentData,
                    [parentProperty]: {
                        ...currentData[parentProperty],
                        subFeatures: {
                            ...currentData[parentProperty].subFeatures,
                            [subProperty]: {
                                ...currentData[parentProperty].subFeatures![subProperty],
                                stringValue: value
                            }
                        }
                    }
                };
            } else {
                updatedData = {
                    ...currentData,
                    [parentProperty]: {
                        ...currentData[parentProperty],
                        subFeatures: {
                            ...currentData[parentProperty].subFeatures,
                            [subProperty]: {
                                ...currentData[parentProperty].subFeatures![subProperty],
                                dropdownValue: value
                            }
                        }
                    }
                };
            }
            this.#data.set(updatedData);
        }
    }

    public get data(): Signal<ComponentConfigFeatureItem> {
        return this.#data.asReadonly();
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
