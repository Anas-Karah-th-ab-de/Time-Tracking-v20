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
  readonly httpOptions = {
    headers: new HttpHeaders({ 'PrestigePromotion': 'MA-Ak-KM-Idlib-+963-023' })
  };
  userRole!: string;
  displayedColumns: string[] = ['name', 'stueckanzahl', 'summe'];
  aktuellesProjekt: any;
  letzteProjekt: any;
  mitarbeiterDatenMap = new Map<string, any>();
  mitarbeiterDaten: Mitarbeiterku[] = [];
  recognizedMitarbeiters: RecognizedMitarbeiter[] = [];
  gesammelteDaten: any[] = [];
  projektDaten: {
    
    projektleiter?: any;
    ha?: string;
    mitarbeiter?: any[];
  } = { mitarbeiter: [] };  mitarbeiterProduktionsschritte: { [mitarbeiterName: string]: string } = {};
  
  // Statusvariablen
  editMode: boolean = false;
  isMitarbeiterQrScanned = false;
  produktionslinieEingegeben = false;
  
  // Benutzereingaben
  aktuellesMitarbeiterName: string = '';
  startzeit!: string;
  private _produktionslinie = '';
  
  // Fehlermeldungen
  projektleiterFehlermeldung = '';
  haFehlermeldung = '';
  mitarbeiterFehlermeldung = '';
  
  // Berechnungen
  Gesamtstueckzahlmitarbeiter = 0;
  gesamtDatenltzete = 0;

  // Konstruktor
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    (window as any).isControlledReload = false;
  }

  // Getter und Setter
  get produktionslinie(): string {
    return this._produktionslinie;
  }

  set produktionslinie(value: string) {
    this._produktionslinie = value;
  }
  auftrag!:string;
  // Ihre weiteren Eigenschaften und Methoden...
  ngOnInit(): void {
    // Abonnement auf Route-Query-Parameter
    this.route.queryParams.subscribe(params => {
      this.ladeInitialeDatenAusQueryParametern(params);
      this.ladeAktuellesProjektVomServer();
      this.ladeVorletztesNichtAktivesProjektVomServer();
    });
  }
  
  private ladeInitialeDatenAusQueryParametern(params: any): void {
    // Extrahieren der notwendigen Werte aus den Query-Parametern
    const { produktionslinie, auftrag, datum, rolle } = params;
    this.auftrag=auftrag;
    this.produktionslinie=produktionslinie;
    this.userRole = rolle;
    this.startzeit = datum; // oder direkt ohne Zwischenvariable, falls bevorzugt
  }
  
  private ladeAktuellesProjektVomServer(): void {
    this.http.get('http://kmapp.prestigepromotion.de:3002/projekt', {
      params: { produktionslinie: this.produktionslinie, auftrag: this.auftrag, startzeit: this.startzeit },
      headers: this.httpOptions.headers
    }).subscribe(projekt => {
      this.verarbeiteAktuellesProjekt(projekt);
    });
  }
  
  private verarbeiteAktuellesProjekt(projekt: any): void {
    console.log(projekt); // Für Debugging-Zwecke
    this.aktuellesProjekt = projekt;
    this.mitarbeiterDaten = projekt.mitarbeiter;
  
    if (projekt.palettenDaten) {
      // Zuweisung der Palettendaten
      this.formVollePaletten = projekt.palettenDaten.vollePaletten;
      this.formRestPalettenListe = projekt.palettenDaten.restPaletten;
      this.formGesamt = projekt.palettenDaten.gesamtDaten;
      this.aktualisiereBerechnungen();
    }
  }
  
  private ladeVorletztesNichtAktivesProjektVomServer(): void {
    this.http.get<Projekt>('http://kmapp.prestigepromotion.de:3002/api/vorletztes-nicht-aktives-projekt', {
      params: { produktionslinie: this.produktionslinie, auftrag: this.auftrag, startzeit: this.startzeit },
      headers: this.httpOptions.headers
    }).subscribe(projekt => {
      this.verarbeiteVorletztesProjekt(projekt);
    });
  }
  
  private verarbeiteVorletztesProjekt(projekt: Projekt): void {
    this.letzteProjekt = projekt;
    if (this.letzteProjekt&&this.letzteProjekt.palettenDaten) {
      // Jetzt können Sie die Daten sicher zuweisen
      this.letzteformVollePaletten = this.letzteProjekt.palettenDaten.vollePaletten ;
      this.letzteformRestPalettenListe = this.letzteProjekt.palettenDaten.restPaletten;
      this.letzteformGesamt = this.letzteProjekt.palettenDaten.gesamtDaten ;
      this.aktualisiereBerechnungen();
    } else {
      console.log('Keine palettenDaten verfügbar');
    }
  }




  formVollePaletten = { paletten: 0, kartons: 0, stueckKarton: 0, gesamtmenge: 0 };
  formRestPalettenListe: any[] = [
    { paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 }
  ];
  formGesamt = { liefermenge: 0, musterKunde: 0, musterPP: 0, gesamtmenge: 0, ausschuss: 0, sumAusschusse: 0, produzierteStueckzahl: 0 };
  
  letzteformVollePaletten = { paletten: 0, kartons: 0, stueckKarton: 0, gesamtmenge: 0 };
  letzteformRestPalettenListe: any[] = [
    { paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 }
  ];
  letzteformGesamt = { liefermenge: 0, musterKunde: 0, musterPP: 0, gesamtmenge: 0, ausschuss: 0, sumAusschusse: 0, produzierteStueckzahl: 0 };

  // Zustandsdefinitionen für Bestätigungsflags
  vollePalettenBestaetigt = { paletten: false, kartons: false, stueckKarton: false };
  restPalettenBestaetigt = { paletten: false, kartons: false, stueckKarton: false, stueckRestkarton: false };
  gesamtDatenBestaetigt = { 
    liefermenge: false, 
    musterKunde: false, 
    musterPP: false, 
    ausschuss: false,
    gesamtDaten: false 
  };

  // Methoden zur Manipulation der Zustände
  addRestPalette(): void {
    this.formRestPalettenListe.push({ paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 });
  }

  addRestPaletteletzte(): void {
    this.letzteformRestPalettenListe.push({ paletten: 0, kartons: 0, stueckKarton: 0, stueckRestkarton: 0, gesamtmenge: 0 });
  }

  // Reset-Logik für Formularfelder
  resetFormFields(): void {
    this.resetVollePaletten();
    this.resetRestPaletten();
    this.resetGesamtDaten();
  }

  private resetVollePaletten(): void {
    Object.keys(this.formVollePaletten).forEach(key => {
      if ((this.formVollePaletten as any)[key] === 0) {
        (this.formVollePaletten as any)[key] = '';
      }
    });
  }

  private resetRestPaletten(): void {
    this.formRestPalettenListe.forEach(restPalette => {
      Object.keys(restPalette).forEach(key => {
        if (restPalette[key] === 0) {
          restPalette[key] = '';
        }
      });
    });
  }

  private resetGesamtDaten(): void {
    Object.keys(this.formGesamt).forEach(key => {
      if ((this.formGesamt as any)[key] === 0) {
        (this.formGesamt as any)[key] = '';
      }
    });
  }


  Menge1vollePalette!:number;
  sumAusschusse !:number;
  aktualisiereBerechnungen(): void {
    this.berechneGesamtstueckzahlMitarbeiter();
    this.berechneVollePaletten();
    this.berechneRestPaletten();
    this.berechneGesamtmenge();
    this.berechneLiefermenge();
    this.Produzierte();
  }
  private berechneGesamtstueckzahlMitarbeiter(): void {
    this.Gesamtstueckzahlmitarbeiter = this.mitarbeiterDaten.reduce((sum, current) => sum + current.stueckanzahl, 0);
  }
  private Produzierte (): void {
    
    
    this.formGesamt.produzierteStueckzahl= (this.formVollePaletten.gesamtmenge + this.formRestPalettenListe.reduce((sum, palette) => sum + palette.gesamtmenge, 0)) - this.letzteformGesamt.gesamtmenge;
   
  }
  private berechneVollePaletten(): void {
    this.Menge1vollePalette = this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton;
    this.formVollePaletten.gesamtmenge = this.formVollePaletten.paletten * this.Menge1vollePalette;
  }

  private berechneRestPaletten(): void {
    
    this.formRestPalettenListe.forEach(restPalette => {
      restPalette.gesamtmenge = (restPalette.paletten * restPalette.kartons * restPalette.stueckKarton) + restPalette.stueckRestkarton;
    });
    
  }

  private berechneGesamtmenge(): void {
    
    this.formGesamt.liefermenge =this.formVollePaletten.gesamtmenge + this.formRestPalettenListe.reduce((sum, palette) => sum + palette.gesamtmenge, 0);
    this.formGesamt.sumAusschusse = this.letzteformGesamt.ausschuss + this.formGesamt.ausschuss;
  }

  private berechneLiefermenge(): void {
    this.formGesamt.gesamtmenge = this.formGesamt.liefermenge + this.formGesamt.musterKunde + this.formGesamt.musterPP + this.formGesamt.ausschuss;
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
  
  bestaetigenUndSpeichern(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '600px',
      data: { message: 'Sind Sie sicher, dass Sie speichern möchten?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.valid()) {
        this.save();
      } else {
        console.log('Speicherung abgebrochen.');
      }
    });
  }

  save(): void {
    const projektDaten = this.sammleProjektDaten();
    this.updateProject(this.aktuellesProjekt._id, projektDaten).subscribe(response => {
      console.log('Projekt erfolgreich aktualisiert', response);
      this.navigateBasedOnCondition();
    }, error => {
      console.error('Fehler beim Aktualisieren des Projekts', error);
    });
  }
  private sammleProjektDaten() {
    return {
      palettenDaten: {
        vollePaletten: this.formVollePaletten,
        restPaletten: this.formRestPalettenListe,
        gesamtDaten: this.formGesamt
      },
      mitarbeiter: this.mitarbeiterDaten // Annahme: korrekt formatiert
    };
  }

  
  valid(){
    //if (this.aktuellesProjekt.version !== null && this.aktuellesProjekt.version !== 0) {
      //  const validierungsFehler = this.validateFormData();
       // if (validierungsFehler) {
       //     console.error(validierungsFehler); // Log the error
       //     alert(validierungsFehler); // Display the error in an alert dialog
       //     return false; // Indicate validation failed
       // }
   // }
    return true; // Indicate validation succeeded
  }
  
  navigateBasedOnCondition(): void {
    if (this.userRole === 'Projektleiter') {
      this.router.navigate(['/fertige-Stundenzettel']);
    } else if (this.userRole === 'Tablet') {
      this.router.navigate(['/Stundenzettel']);
    }
    // Weitere Bedingungen und Navigationslogik hier...
  }

  // Angular Service-Methode zum Aktualisieren eines Projekts
  updateProject(projektId: string, projektDaten: any): Observable<any> {
    return this.http.put(`http://kmapp.prestigepromotion.de:3002/projekt/${projektId}`, projektDaten, this.httpOptions);
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
