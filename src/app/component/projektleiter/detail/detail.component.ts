import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Mitarbeiterku } from '../../../model/mitarbeiter.model';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { HttpHeaders } from '@angular/common/http';

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

readonly httpOptions = {
  headers: new HttpHeaders({
    'PrestigePromotion': 'MA-Ak-KM-Idlib-+963-023'
  })
};
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
  startzeit!:string;
  // Ihre weiteren Eigenschaften und Methoden...
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const produktionslinie = params['produktionslinie'];
      const auftrag = params['auftrag'];
      const datum = params['datum'];
      this.userRole= params['rolle']; 

      const startzeit = datum
      // Abrufen des Projekts vom Server
      this.http.get('http://kmapp.prestigepromotion.de:3002/projekt', { 
        params: { produktionslinie, auftrag,startzeit },
        headers: this.httpOptions.headers // Übernehmen der Header aus httpOptions
      }).subscribe(projekt => {
          console.log(projekt)
          this.aktuellesProjekt = projekt;
          //console.log(projekt);
         
            this.mitarbeiterDaten = this.aktuellesProjekt.mitarbeiter;
           // console.log('werwer',this.mitarbeiterDaten);
           if (this.aktuellesProjekt && this.aktuellesProjekt.palettenDaten) {
            this.formVollePaletten = this.aktuellesProjekt.palettenDaten.vollePaletten;
            this.formRestPalettenListe = this.aktuellesProjekt.palettenDaten.restPaletten;
            this.formGesamt = this.aktuellesProjekt.palettenDaten.gesamtDaten;
           this.aktualisiereBerechnungen();
        }
        
        });
     
        
       // Stellen Sie sicher, dass Sie die Schnittstellen `Projekt`, `PaletteDaten`, und `GesamtDaten` bereits definiert haben

this.http.get<Projekt>('http://kmapp.prestigepromotion.de:3002/api/vorletztes-nicht-aktives-projekt', { 
  params: { produktionslinie, auftrag, startzeit },
  headers: this.httpOptions.headers
}).subscribe(projekt => {
  this.letzteProjekt=projekt
  if (this.letzteProjekt&&this.letzteProjekt.palettenDaten) {
    // Jetzt können Sie die Daten sicher zuweisen
    this.letzteformVollePaletten = this.letzteProjekt.palettenDaten.vollePaletten ;
    this.letzteformRestPalettenListe = this.letzteProjekt.palettenDaten.restPaletten;
    this.letzteformGesamt = this.letzteProjekt.palettenDaten.gesamtDaten ;
    this.aktualisiereBerechnungen();
  } else {
    console.log('Keine palettenDaten verfügbar');
  }
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
  formRestPalettenListe: any[] = [
    { paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 }
  ];
  formGesamt = { liefermenge: 0, musterKunde: 0, musterPP: 0, gesamtmenge: 0, ausschuss: 0 ,sumAusschusse:0 ,produzierteStueckzahl:0};
  letzteformVollePaletten = { paletten: 0, kartons: 0, stueckKarton: 0, gesamtmenge: 0 };
  letzteformRestPalettenListe: PaletteDaten[] = [
    { paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 }
  ];
    letzteformGesamt = { liefermenge: 0, musterKunde: 0, musterPP: 0, gesamtmenge: 0, ausschuss: 0 ,sumAusschusse:0,produzierteStueckzahl:0};

  vollePalettenBestaetigt = { paletten: false, kartons: false, stueckKarton: false };
  restPalettenBestaetigt = { paletten: false, kartons: false, stueckKarton: false, stueckRestkarton: false };
  gesamtDatenBestaetigt = { 
    liefermenge: false, 
    musterKunde: false, 
    musterPP: false, 
    ausschuss: false, // Ausschuss bestätigen
    gesamtDaten: false 
  };  

  addRestPalette(): void {
    this.formRestPalettenListe.push({ paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 });
  }
  addRestPaletteletzte(): void {
    this.letzteformRestPalettenListe.push({ paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 });
  }
  // ...
  resetFormFields() {
    
    // Reset für formVollePaletten
    Object.keys(this.formVollePaletten).forEach(key => {
      if ((this.formVollePaletten as any)[key] === 0) {
        (this.formVollePaletten as any)[key] = '';
      }
    });
  
    // Reset für formRestPaletten
    this.formRestPalettenListe.forEach(restPalette => {
      Object.keys(restPalette).forEach(key => {
        if (restPalette[key] === 0) {
          restPalette[key] = '';
        }
      });
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
  
    // Berechnung für volle Paletten
    this.Menge1vollePalette = this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton;
    this.formVollePaletten.gesamtmenge = this.formVollePaletten.paletten * this.Menge1vollePalette;
  
    // Berechnungen für jede Restpalette
    this.formRestPalettenListe.forEach(restPalette => {
      restPalette.gesamtmenge = (restPalette.paletten * (restPalette.kartons ) * restPalette.stueckKarton) + restPalette.stueckRestkarton;
    });
  
    // Berechnung der neuen Gesamtmenge
    this.formGesamt.gesamtmenge = this.formGesamt.produzierteStueckzahl +  this.letzteformGesamt.gesamtmenge;
    this.formGesamt.sumAusschusse=this.letzteformGesamt.ausschuss+this.formGesamt.ausschuss;
    // Berechnung der Liefermenge
    this.formGesamt.liefermenge = this.formGesamt.gesamtmenge - this.formGesamt.musterKunde - this.formGesamt.musterPP - (this.formGesamt.sumAusschusse );
  
    // Logging für Debugging-Zwecke
    //console.log("Liefermenge:", this.formGesamt.liefermenge);
  }
  
  bestaetigenUndSpeichern(): void {
    //console.log('start');
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '600px',
      data: { message: 'Sind Sie sicher, dass Sie speichern möchten?' }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Nur validieren, wenn das Dialog-Ergebnis positiv ist
        if (this.valid()) {
          this.save(); // Speichern aufrufen, wenn Validierung erfolgreich
        }
      } else {
        console.log('Speicherung abgebrochen.'); // Oder andere Logik für den Abbruch
      }
    });
  }
  
  save(){
    const projektDaten = {
      // Collect all relevant form data...
      palettenDaten: {
          vollePaletten: this.formVollePaletten,
          restPaletten: this.formRestPalettenListe,
          gesamtDaten: this.formGesamt
      },
      mitarbeiter: this.mitarbeiterDaten // Assuming this is correctly formatted
    };
  
    this.updateProject(this.aktuellesProjekt._id, projektDaten).subscribe(
        response => {
            console.log('Projekt erfolgreich aktualisiert', response);
            this.navigateBasedOnCondition();
        },
        error => {
            console.error('Fehler beim Aktualisieren des Projekts', error);
        }
    );
    
  }
  
  valid(){
    if (this.aktuellesProjekt.version !== null && this.aktuellesProjekt.version !== 0) {
        const validierungsFehler = this.validateFormData();
        if (validierungsFehler) {
            console.error(validierungsFehler); // Log the error
            alert(validierungsFehler); // Display the error in an alert dialog
            return false; // Indicate validation failed
        }
    }
    return true; // Indicate validation succeeded
  }
  
  userRole!:string;
  navigateBasedOnCondition() {
    // Beispielbedingung: Rolle des Benutzers ist 'Projektleiter'
    const userRole =  this.userRole; // Dies sollte dynamisch aus Ihrem Authentifizierungsservice oder Benutzerkontext abgerufen werden
    console.log(userRole)
    console.log(this.userRole)
    if (userRole === 'Projektleiter') {
      this.router.navigate(['/projektleiter']);
    } else if (userRole === 'Tablet') { // Beispiel für eine weitere Bedingung
      this.router.navigate(['/tablet']);
    }
  }
  
// Angular Service-Methode zum Aktualisieren eines Projekts
updateProject(projektId: string, projektDaten: any): Observable<any> {
  return this.http.put(`http://kmapp.prestigepromotion.de:3002/projekt/${projektId}`, projektDaten, this.httpOptions);
}

validateFormData(): string | null {
  // Überprüfung der vollen Paletten
  if (!this.formVollePaletten.paletten || !this.formGesamt.liefermenge) {
    return 'Einige erforderliche Daten für volle Paletten fehlen.';
  }

  // Überprüfung jeder Restpalette


  // Berechnung der Gesamtstückzahl der Mitarbeiter
  const gesamtStueckzahlMitarbeiter = this.mitarbeiterDaten.reduce((sum, current) => sum + current.stueckanzahl, 0);

  // Überprüfung, ob die Summe der Stückzahlen der MA gleich der produzierten Menge ist
  if (gesamtStueckzahlMitarbeiter !== this.formGesamt.produzierteStueckzahl) {
    return 'Die Summe der Stückzahlen der Mitarbeiter entspricht nicht der produzierten Menge.';
  }

  // Berechnung der Gesamtstückzahl aller Paletten
  const gesamtStueckzahlPaletten = this.formVollePaletten.gesamtmenge + this.formRestPalettenListe.reduce((sum, palette) => sum + palette.gesamtmenge, 0);

  // Überprüfung, ob die Summe der Stückzahlen aller Paletten gleich der Liefermenge ist
  if (gesamtStueckzahlPaletten !== this.formGesamt.liefermenge) {
    return 'Die Summe der Stückzahlen aller Paletten entspricht nicht der Liefermenge.';
  }

  return null; // Kein Fehler gefunden
}

  












}
interface PaletteDaten {
  paletten: number;
  kartons: number;
  stueckKarton: number;
  gesamtmenge: number;
  stueckRestkarton?: number; // Optional, nur für letzteformRestPaletten relevant
}

interface GesamtDaten {
  liefermenge: number;
  musterKunde: number;
  musterPP: number;
  gesamtmenge: number;
  ausschuss: number;
  sumAusschusse: number;
}


interface Projekt {
  palettenDaten?: {
    vollePaletten: PaletteDaten;
    restPaletten: PaletteDaten;
    gesamtDaten: GesamtDaten;
  };
}
