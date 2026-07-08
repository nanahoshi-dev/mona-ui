import { DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { take, timer } from "rxjs";
import { Action } from "./Action";

export const rxTimeout = (destroyRef: DestroyRef, fn: Action, delay: number = 0): void => {
    timer(delay)
        .pipe(takeUntilDestroyed(destroyRef), take(1))
        .subscribe(() => fn());
};
