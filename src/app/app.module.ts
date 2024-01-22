import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './component/login/login.component';
import { ProduktionslinienComponent } from './component/produktionslinien/produktionslinien.component';
import { AuftragsDetailsModalComponent } from './component/produktionslinien/auftrags-details-modal/auftrags-details-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProjektleiterAbfrageComponent } from './component/produktionslinien/projektleiter-abfrage/projektleiter-abfrage.component';
import { PersonalschleuseComponent } from './component/personalschleuse/personalschleuse.component';
import { ProjektleiterComponent } from './component/projektleiter/projektleiter.component';
import { DetailComponent } from './component/projektleiter/detail/detail.component';
import { NaviComponent } from './component/navi/navi.component';
import { MitarbeiterListeComponent } from './component/mitarbeiter-liste/mitarbeiter-liste.component';
import { MitarbeiterErstellenComponent } from './component/mitarbeiter-erstellen/mitarbeiter-erstellen.component';
import { MitarbeiterDetailComponent } from './component/mitarbeiter-detail/mitarbeiter-detail.component';
import { QrCodeDialogComponent } from './component/qr-code-dialog/qr-code-dialog.component';
import { BrichtComponent } from './component/bricht/bricht.component';
import { TagesberichtComponent } from './component/bricht/tagesbericht/tagesbericht.component';
import { ReactiveFormsModule } from '@angular/forms';
import { GrafikComponent } from './component/Bricht/tagesbericht/grafik/grafik.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProduktionslinienComponent,
    AuftragsDetailsModalComponent,
    ProjektleiterAbfrageComponent,
    PersonalschleuseComponent,
    ProjektleiterComponent,
    DetailComponent,
    NaviComponent,
    MitarbeiterListeComponent,
    MitarbeiterErstellenComponent,
    MitarbeiterDetailComponent,
    QrCodeDialogComponent,
    BrichtComponent,
    TagesberichtComponent,
    GrafikComponent
  ],
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
   
    MatSidenavModule,
    MatIconModule,
    MatListModule,
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
