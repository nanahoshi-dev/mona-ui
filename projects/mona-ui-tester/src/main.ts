import { Directionality } from "@angular/cdk/bidi";
import { enableProdMode, provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { CustomDirectionalityService } from "./app/services/custom-directionality.service";
import { provideMonaUiTheme } from "@nanahoshi/mona-ui/theme";

import { environment } from "./environments/environment";

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
        provideZoneChangeDetection(),
        ...appConfig.providers,
        {
            provide: Directionality,
            useClass: CustomDirectionalityService
        },
        provideMonaUiTheme({ defaultThemeId: "mona-light" })
    ]
}).catch(err => console.error(err));
