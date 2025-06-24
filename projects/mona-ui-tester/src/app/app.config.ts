import { NgOptimizedImage } from "@angular/common";
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
        provideRouter(routes)
    ]
};
