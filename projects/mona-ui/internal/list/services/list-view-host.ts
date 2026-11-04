import { InjectionToken } from "@angular/core";
import type { ListService } from "./list.service";

/**
 * Lets a component that wraps a `mona-list-view` in its own template share its `ListService` with that list view.
 * Provide it in `viewProviders` (`{ provide: LIST_VIEW_HOST_LIST_SERVICE, useExisting: ListService }`), so only the
 * component's own list view sees it, never a list view placed in content the component projects or renders from a
 * consumer's template. Without it, every list view has its own service.
 */
export const LIST_VIEW_HOST_LIST_SERVICE = new InjectionToken<ListService<unknown>>("LIST_VIEW_HOST_LIST_SERVICE");
