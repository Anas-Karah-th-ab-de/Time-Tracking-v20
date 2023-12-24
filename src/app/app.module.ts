import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './component/login/login.component';
import { ProduktionslinienComponent } from './component/produktionslinien/produktionslinien.component';
import { AuftragsDetailsModalComponent } from './component/produktionslinien/auftrags-details-modal/auftrags-details-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProjektleiterAbfrageComponent } from './component/produktionslinien/projektleiter-abfrage/projektleiter-abfrage.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProduktionslinienComponent,
    AuftragsDetailsModalComponent,
    ProjektleiterAbfrageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
