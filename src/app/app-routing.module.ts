import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { ProduktionslinienComponent } from './component/produktionslinien/produktionslinien.component';
import { PersonalschleuseComponent } from './component/personalschleuse/personalschleuse.component';
import { ProjektleiterComponent } from './component/projektleiter/projektleiter.component';
import { DetailComponent } from './component/projektleiter/detail/detail.component';
import { MitarbeiterDetailComponent } from './component/mitarbeiter-detail/mitarbeiter-detail.component';
import { MitarbeiterErstellenComponent } from './component/mitarbeiter-erstellen/mitarbeiter-erstellen.component';
import { MitarbeiterListeComponent } from './component/mitarbeiter-liste/mitarbeiter-liste.component';
import { TagesberichtComponent } from './component/bricht/tagesbericht/tagesbericht.component';
import { BrichtComponent } from './component/bricht/bricht.component';

import { AlteprojekteComponent } from './component/projektleiter/alteprojekte/alteprojekte.component';
import { TabeletComponent } from './component/projektleiter/tabelet/tabelet.component';
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'tablet', component: TabeletComponent },
  { path: 'login', component: LoginComponent },
  // Aktualisierte Route mit Parameter
  { path: 'produktionslinien/:linie', component: ProduktionslinienComponent },
  { path: 'personalschleuse', component: PersonalschleuseComponent },
  { path: 'projektleiter', component: ProjektleiterComponent },
  { path: 'alt', component: AlteprojekteComponent },
  { path: 'projektleiter/:projektleiter', component: ProjektleiterComponent },
  { path: 'projektdetails', component: DetailComponent },
  { path: 'mitarbeiter-liste', component: MitarbeiterListeComponent },
  { path: 'mitarbeiter-detail', component: MitarbeiterDetailComponent },
  { path: 'mitarbeiter-erstellen', component: MitarbeiterErstellenComponent },
  //{path:'tagsbricht', component:TagesberichtComponent},

  
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
