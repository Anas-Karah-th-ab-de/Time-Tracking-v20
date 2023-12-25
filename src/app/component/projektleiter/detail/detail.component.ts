import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { MatSnackBar } from '@angular/material/snack-bar';
import { Mitarbeiterku } from '../../../model/mitarbeiter.model';

interface RecognizedMitarbeiter {
  _id: string;
  name: string;
}
@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css'
})
export class DetailComponent {

  mitarbeiterDatenMap = new Map<string, any>();
  mitarbeiterDaten: Mitarbeiterku[] = [];
  editMode: boolean = false;
  recognizedMitarbeiters: RecognizedMitarbeiter[] = [];
  aktuellesMitarbeiterName: string = '';
  constructor(private snackBar: MatSnackBar,private dialog: MatDialog) {  (window as any).isControlledReload = false; }
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
  formGesamt = { liefermenge: 0, musterKunde: 0, musterPP: 0, gesamtmenge: 0, ausschuss: 0 };

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
  
  bestaetigeVollePaletten() {
    this.vollePalettenBestaetigt.paletten = true;
    this.vollePalettenBestaetigt.kartons = true;
    this.vollePalettenBestaetigt.stueckKarton = true;
    this.formVollePaletten.gesamtmenge =  ((this.gesamtDatenltzete+this.Gesamtstueckzahlmitarbeiter) % ( this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton));
    this.formRestPaletten.gesamtmenge= (this.Gesamtstueckzahlmitarbeiter+ this.gesamtDatenltzete)%( this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton)
    this.formVollePaletten.paletten = Math.ceil(this.formVollePaletten.gesamtmenge / (this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton));
    
  // //console.log(this.gesamtDatenltzete,this.Gesamtstueckzahlmitarbeiter,this.formVollePaletten.gesamtmenge, this.formVollePaletten.paletten)
if (this.formRestPaletten.gesamtmenge > 0) {
  this.formRestPaletten.paletten = 1;
} else {
  this.formRestPaletten.paletten = 0; // Assuming Feld6 is another property you want to set
}
this.formRestPaletten.stueckKarton =this.formVollePaletten.stueckKarton
this.formRestPaletten.stueckRestkarton =this.formRestPaletten.gesamtmenge % this.formVollePaletten.stueckKarton
this.formRestPaletten.kartons= (this.formRestPaletten.gesamtmenge -this.formRestPaletten.stueckKarton)/this.formVollePaletten.stueckKarton;
    this.formRestPaletten.gesamtmenge = this.formRestPaletten.paletten * this.formRestPaletten.kartons * this.formRestPaletten.stueckRestkarton;


  }

  bestaetigeGesamtDaten() {
    // //console.log(this.gesammelteMitarbeiter)
    this.gesamtDatenBestaetigt.liefermenge = true;
    this.gesamtDatenBestaetigt.musterKunde = true;
    this.gesamtDatenBestaetigt.musterPP = true;
    this.gesamtDatenBestaetigt.ausschuss = true; // Ausschuss bestätigen
    this.gesamtDatenBestaetigt.gesamtDaten = true;
    this.formGesamt.liefermenge= this.formVollePaletten.paletten+ this.Gesamtstueckzahlmitarbeiter-this.formGesamt.musterKunde-this.formGesamt.musterPP
    // Berechnung der Gesamtmenge unter Berücksichtigung des Ausschusses
    this.formGesamt.gesamtmenge = this.Gesamtstueckzahlmitarbeiter + this.gesamtDatenltzete;
  

  }
  aktualisiereBerechnungen() {
    this.Gesamtstueckzahlmitarbeiter = this.mitarbeiterDaten.reduce((sum, current) => sum + current.stueckanzahl, 0);

    this.formVollePaletten.gesamtmenge =  ((this.gesamtDatenltzete+this.Gesamtstueckzahlmitarbeiter) % ( this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton));
  	this.formRestPaletten.gesamtmenge= (this.Gesamtstueckzahlmitarbeiter+ this.gesamtDatenltzete)%((this.Gesamtstueckzahlmitarbeiter+ this.gesamtDatenltzete)-( this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton))
    this.formVollePaletten.paletten = Math.ceil(this.formVollePaletten.gesamtmenge / (this.formVollePaletten.kartons * this.formVollePaletten.stueckKarton));
  	if (this.formRestPaletten.gesamtmenge > 0) {
  	  this.formRestPaletten.paletten = 1;
  	} else {
  	  this.formRestPaletten.paletten = 0; // Assuming Feld6 is another property you want to set
  	}
  	this.formRestPaletten.stueckKarton =this.formVollePaletten.stueckKarton
  	this.formRestPaletten.stueckRestkarton =this.formRestPaletten.gesamtmenge % this.formVollePaletten.stueckKarton
  	this.formRestPaletten.kartons= (this.formRestPaletten.gesamtmenge -this.formRestPaletten.stueckKarton)/this.formVollePaletten.stueckKarton;
    this.formRestPaletten.gesamtmenge = this.formRestPaletten.paletten * this.formRestPaletten.kartons * this.formRestPaletten.stueckRestkarton;
    this.formGesamt.liefermenge= this.formVollePaletten.paletten+ this.Gesamtstueckzahlmitarbeiter-this.formGesamt.musterKunde-this.formGesamt.musterPP
    // Berechnung der Gesamtmenge unter Berücksichtigung des Ausschusses
    this.formGesamt.gesamtmenge = this.Gesamtstueckzahlmitarbeiter + this.gesamtDatenltzete;

    
  }
  

  bestaetigenUndSpeichern() {
    // Logik zur Überprüfung oder Verarbeitung der Daten vor dem Speichern
    // Beispiel:
   

    
    const dataToSend = {
      vollePaletten: this.formVollePaletten,
      restPaletten: this.formRestPaletten,
      gesamtDaten: this.formGesamt,
      mitarbeiter: this.mitarbeiterDaten
    };
    // //console.log('ssssssssssssssss',this.mitarbeiterDaten)
    // //console.log('dataToSend',dataToSend)
    // Beispiel für das Speichern der Daten
   
//console.log('ssssssssssssssss',this.mitarbeiterDaten)
      // //console.log('dataToSend',dataToSend)
     
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

