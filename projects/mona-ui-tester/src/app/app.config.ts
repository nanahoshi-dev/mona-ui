import { NgOptimizedImage } from "@angular/common";
import { provideHttpClient } from "@angular/common/http";
import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { routes } from "./routes";

export const appConfig: ApplicationConfig = {
    providers: [
        importProvidersFrom(FontAwesomeModule, FormsModule, NgOptimizedImage),
        provideAnimations(),
        provideHttpClient(),
        provideRouter(routes)
    ]
};
