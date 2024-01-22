import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Mitarbeiterku } from '../../../model/mitarbeiter.model';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
interface RecognizedMitarbeiter {
  _id: string;
  name: string;
}
@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css'
})
export class DetailComponent implements OnInit{
// In Ihrer DetailsComponent-Klasse


aktuellesProjekt: any;
letzteProjekt: any;
  mitarbeiterDatenMap = new Map<string, any>();
  mitarbeiterDaten: Mitarbeiterku[] = [];
  editMode: boolean = false;
  recognizedMitarbeiters: RecognizedMitarbeiter[] = [];
  aktuellesMitarbeiterName: string = '';
  constructor(private route: ActivatedRoute, private http: HttpClient,private router: Router,private snackBar: MatSnackBar,private dialog: MatDialog) {  (window as any).isControlledReload = false; }
  projektleiterFehlermeldung = '';
  haFehlermeldung = '';
  mitarbeiterFehlermeldung = '';
  gesammelteDaten: any[] = [];
  Gesamtstueckzahlmitarbeiter = 0;
  gesamtDatenltzete=0;
  public data: any
  projektDaten: {
    
    projektleiter?: any;
    ha?: string;
    mitarbeiter?: any[];
  } = { mitarbeiter: [] };
  isMitarbeiterQrScanned = false;
  mitarbeiterProduktionsschritte: { [mitarbeiterName: string]: string } = {};
  produktionslinieEingegeben = false;

  // Ihre weiteren Eigenschaften und Methoden...
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const produktionslinie = params['produktionslinie'];
      const auftrag = params['auftrag'];
      const datum = params['datum'];
      console.log(produktionslinie, auftrag, datum);
  
      // Abrufen des Projekts vom Server
      this.http.get('http://kmapp.prestigepromotion.de:3002/projekt', { params: { produktionslinie, auftrag, datum } })
        .subscribe(projekt => {
          this.aktuellesProjekt = projekt;
          console.log(projekt);
         
            this.mitarbeiterDaten = this.aktuellesProjekt.mitarbeiter;
            console.log('werwer',this.mitarbeiterDaten);
            this.formVollePaletten = this.aktuellesProjekt.palettenDaten.vollePaletten;
            this.formRestPaletten = this.aktuellesProjekt.palettenDaten.restPaletten;
            this.formGesamt = this.aktuellesProjekt.palettenDaten.gesamtDaten;
          
        });
  
      this.http.get('http://kmapp.prestigepromotion.de:3002/api/vorletztes-nicht-aktives-projekt', { params: { produktionslinie, auftrag } })
        .subscribe(projekt => {
          this.letzteProjekt = projekt;
  
          
            this.letzteformVollePaletten = this.letzteProjekt.palettenDaten.vollePaletten;
            this.letzteformRestPaletten = this.letzteProjekt.palettenDaten.restPaletten;
            this.letzteformGesamt = this.letzteProjekt.palettenDaten.gesamtDaten;
          
  
          console.log(projekt);
        });
    });
  }
  
  private _produktionslinie = '';

  get produktionslinie(): string {
    return this._produktionslinie;
  }
  
  set produktionslinie(value: string) {
    // //console.log('Setter aufgerufen mit:', value);
    this._produktionslinie = value;
  
    if (value) {
      // //console.log('Bestätigung wird aufgerufen');
      
    }
  }
  private inputTimeout: any;




  formVollePaletten = { paletten: 0, kartons: 0, stueckKarton: 0, gesamtmenge: 0 };
  formRestPaletten = { paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 };
  formGesamt = { liefermenge: 0, musterKunde: 0, musterPP: 0, gesamtmenge: 0, ausschuss: 0 ,sumAusschusse:0};
  letzteformVollePaletten = { paletten: 0, kartons: 0, stueckKarton: 0, gesamtmenge: 0 };
  letzteformRestPaletten = { paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 };
  letzteformGesamt = { liefermenge: 0, musterKunde: 0, musterPP: 0, gesamtmenge: 0, ausschuss: 0 ,sumAusschusse:0};

  vollePalettenBestaetigt = { paletten: false, kartons: false, stueckKarton: false };
  restPalettenBestaetigt = { paletten: false, kartons: false, stueckKarton: false, stueckRestkarton: false };
  gesamtDatenBestaetigt = { 
    liefermenge: false, 
    musterKunde: false, 
    musterPP: false, 
    ausschuss: false, // Ausschuss bestätigen
    gesamtDaten: false 
  };  
  // ...
  resetFormFields() {
    
    // Reset für formVollePaletten
    Object.keys(this.formVollePaletten).forEach(key => {
      if ((this.formVollePaletten as any)[key] === 0) {
        (this.formVollePaletten as any)[key] = '';
      }
    });
  
    // Reset für formRestPaletten
    Object.keys(this.formRestPaletten).forEach(key => {
      if ((this.formRestPaletten as any)[key] === 0) {
        (this.formRestPaletten as any)[key] = '';
      }
    });
  
    // Reset für formGesamt
    Object.keys(this.formGesamt).forEach(key => {
      if ((this.formGesamt as any)[key] === 0) {
        (this.formGesamt as any)[key] = '';
      }
    });
  }
  



  Menge1vollePalette!:number;
  sumAusschusse !:number;
  aktualisiereBerechnungen() {
    this.Gesamtstueckzahlmitarbeiter = this.mitarbeiterDaten.reduce((sum, current) => sum + current.stueckanzahl, 0);
    this.Menge1vollePalette=this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton;
   
    this.formGesamt.gesamtmenge = this.Gesamtstueckzahlmitarbeiter + this.gesamtDatenltzete;
    this.formVollePaletten.paletten = Math.ceil(this.formGesamt.gesamtmenge/ this.Menge1vollePalette) ;

    this.formVollePaletten.gesamtmenge = this.formVollePaletten.paletten *  this.Menge1vollePalette ;
   
  	this.formRestPaletten.gesamtmenge= this.formGesamt.gesamtmenge%this.Menge1vollePalette;
  	if (this.formRestPaletten.gesamtmenge > 0) {
  	  this.formRestPaletten.paletten = 1;
  	} else {
  	  this.formRestPaletten.paletten = 0; // Assuming Feld6 is another property you want to set
  	}
  	this.formRestPaletten.stueckKarton =this.formVollePaletten.stueckKarton;
  	this.formRestPaletten.stueckRestkarton =this.formRestPaletten.gesamtmenge % this.formVollePaletten.stueckKarton;

  	this.formRestPaletten.kartons= (this.formRestPaletten.gesamtmenge- this.formRestPaletten.stueckRestkarton)/this.formVollePaletten.stueckKarton;

    this.formGesamt.liefermenge=   this.formGesamt.gesamtmenge - (this.formGesamt.musterKunde + this.formGesamt.musterPP);
    console.log( this.formGesamt.liefermenge)
    console.log(this.formGesamt.musterKunde + this.formGesamt.musterPP)
    // Berechnung der Gesamtmenge unter Berücksichtigung des Ausschusses

    this.formGesamt.sumAusschusse=this.letzteformGesamt.ausschuss+this.formGesamt.ausschuss;
  }
  
  bestaetigenUndSpeichern(): void {
    const projektDaten = {
      // ... Sammeln Sie alle relevanten Daten aus dem Formular ...
      palettenDaten: {
        vollePaletten: this.formVollePaletten,
        restPaletten: this.formRestPaletten,
        gesamtDaten: this.formGesamt
      },
      mitarbeiter: this.mitarbeiterDaten // Angenommen, dies ist korrekt formatiert
    };
  
    this.updateProject(this.aktuellesProjekt._id, projektDaten).subscribe(
      response => {
        console.log('Projekt erfolgreich aktualisiert', response);
        // Weiterer Code nach erfolgreichem Update
        this.router.navigate(['/projektleiter']);
      },
      error => {
        console.error('Fehler beim Aktualisieren des Projekts', error);
        // Fehlerbehandlung
      }
    );
  }
  
// Angular Service-Methode zum Aktualisieren eines Projekts
updateProject(projektId: string, projektDaten: any): Observable<any> {
  return this.http.put(`http://kmapp.prestigepromotion.de:3002/projekt/${projektId}`, projektDaten);
}

  validateFormData() {
    // Validierung der Formulardaten vor dem Senden
    // Beispiel: Überprüfung, ob alle notwendigen Felder ausgefüllt sind
    if (!this.formVollePaletten.paletten || !this.formRestPaletten.paletten || !this.formGesamt.liefermenge) {
      console.error('Einige erforderliche Formulardaten fehlen');
      return false;
    }
    // Weitere Validierungen können hier hinzugefügt werden
    return true;
  }
  












}

