import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams,HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DataSharingService } from '../../service/data-sharing.service';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuftragsDetailsModalComponent } from './auftrags-details-modal/auftrags-details-modal.component';
import { OnInit, Renderer2 } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjektleiterAbfrageComponent } from './projektleiter-abfrage/projektleiter-abfrage.component';
import { Title } from '@angular/platform-browser';
interface DataToSend {
  typ: string;
  inputValue: string;
  projektId?: string;
  produktionslinie: string; // Zusätzliches Feld für die Produktionslinie
  status?: string;
 // _id:string;
  Auftrag:string;
}
interface ZeitIntervall {
  nummer: number;
  start: Date;
  ende: Date;
  dauer: number;
}

interface Mitarbeiter {
  _id?: string;
  name: string;
  anmeldezeit: Date;
  Produktionszeit: ZeitIntervall[];
  Ruestzeit: ZeitIntervall[];
  Wartezeit: ZeitIntervall[];
}

interface Mitarbeiter {
  name: string;
  status: string;
  istProjektleiter?: boolean;
  // Weitere Mitarbeiterdaten...
}
@Component({
  selector: 'app-produktionslinien',
  templateUrl: './produktionslinien.component.html',
  styleUrls: ['./produktionslinien.component.css']
})
export class ProduktionslinienComponent implements OnInit, OnDestroy, AfterViewInit {
  ngOnInit(): void {
   
    this.intervalId = setInterval(() => {
      this.aktualisiereSeite();
    }, 30000); // 300000 ms = 5 Minuten
  }
  @ViewChild('inputField') inputField!: ElementRef;
  schichtAusgewaehlt = false;
  projektStartzeit: Date | null = null; // Startzeit des Projekts             // Speichert die Startzeit des Projekts
  aktivSeit: string = '';              // Speichert die Dauer, wie lange das Projekt aktiv ist
  aktiveMitarbeiter: Mitarbeiter[] = [];
  inputValue: string = '';
  feedbackMessage: string = '';
  auftrag: string = '';
  private inputChanged = new Subject<string>();
  private focusListener: Function | null = null;
  constructor(
    private titleService: Title,
    private route: ActivatedRoute,private cdr: ChangeDetectorRef, private renderer: Renderer2, public dialog: MatDialog, private http: HttpClient,private dataSharingService: DataSharingService) {
    this.inputChanged.pipe(
      debounceTime(100)  // 1000 Millisekunden Wartezeit
    ).subscribe(inputValue => {
      this.sendData(inputValue);
    });
    this.inputSubject.pipe(
      debounceTime(200) // Verzögerung von 2000 Millisekunden
    ).subscribe(value => {
      this.performAction(value);
    });
  }
  istProduktionszeit: boolean = true;
  projektleiterName!:string;

  oeffneDialogUndWechselStatus() {
    if (this.istProduktionszeit) {
      if (this.focusListener) {
        this.focusListener();
        this.focusListener = null;
      }
      // Öffnen des Dialogs zur Projektleiter-Abfrage
      const dialogRef = this.dialog.open(ProjektleiterAbfrageComponent, {
        width: '250px'
        // Weitere Konfigurationen hier
      });

      dialogRef.afterClosed().subscribe(projektleiterName => {
        if (projektleiterName) {
          this.projektleiterName=projektleiterName;
          //console.log(this.projektleiterName)
          // Wenn ein Projektleiter-Name vorhanden ist, Status wechseln
          this.wechselStatus();
          this.initFocusOnInputField();
        } else {
          // Kein Projektleiter-Name vorhanden, keine Änderung des Status
          console.error('Kein Projektleiter-Name vorhanden');
          this.initFocusOnInputField();
        }
      
      });
    } else {
      // Wenn nicht in Produktionszeit, direkt Status wechseln
      this.wechselStatus();
    }
  }
  performAction(value: string) {
    //console.log("Aktion ausführen mit Wert:", value);
    // Setzen einer Feedback-Nachricht
    this.feedbackMessage = `Suche nach: ${value}`;
  
    // Setzen eines Timers, um die Nachricht nach 2 Sekunden zu löschen
    setTimeout(() => {
      this.feedbackMessage = ''; // Löscht die Nachricht nach 2000 Millisekunden
      // Sorgen Sie hier für die Aktualisierung der Ansicht, falls nötig, z.B. durch die Verwendung von ChangeDetectorRef in Angular
      this.cdr.detectChanges(); // Nur nötig, wenn die Änderung nicht automatisch erkannt wird
    }, 2000);
  }
  

  wechselStatus() {
    // Logik zum Wechseln des Status
    this.setzeAlleAufWartzeitOderProduktionszeit();
   // this.istProduktionszeit = !this.istProduktionszeit;
  }
  status:string= 'Produktionszeit';
  setzeAlleAufWartzeitOderProduktionszeit() {
    if (this.istProduktionszeit) {
      this.status='Wartezeit';
      // Wechseln aller Mitarbeiter auf Wartezeit
      this.aktiveMitarbeiter.forEach(mitarbeiter => {
        if (mitarbeiter.name !== this.projektleiterName) {
          mitarbeiter.status = 'Wartezeit';
        } else {
          // Setzen des Projektleiters auf Rüstzeit
          mitarbeiter.status = 'Ruestzeit';
        }
        //console.log( this.aktiveMitarbeiter)
      });
      this.sd();
    } else {
      this.status='Produktionszeit';
      // Wechseln aller Mitarbeiter auf Produktionszeit
      this.aktiveMitarbeiter.forEach(mitarbeiter => {
        mitarbeiter.status = 'Produktionszeit';

      
      });
      this.sd();
    }
    this.istProduktionszeit = !this.istProduktionszeit;

    this.cdr.detectChanges();
    // Update the local flag
    
  
  }
  readonly httpOptions = {
    headers: new HttpHeaders({
      'PrestigePromotion': 'MA-Ak-KM-Idlib-+963-023'
    })
  };
  sd(){
    this.aktiveMitarbeiter.forEach(mitarbeiter => {

      this.http.put(`http://kmapp.prestigepromotion.de:3002/aktualisiereStatus/${this.produktionslinienDaten}`,{
        mitarbeiterName: mitarbeiter.name,
        neueAktivitaet: mitarbeiter.status
      },this.httpOptions ).subscribe({
        
        error: (error) => console.error('Fehler beim Aktualisieren des Mitarbeiterstatus:', error)
      });
    });
  }
  produktionslinienDaten!: string;
  ngAfterViewInit(): void {
    this.produktionslinienDaten = this.route.snapshot.paramMap.get('linie') || 'defaultWert';
    this.titleService.setTitle(`Einbuchen ${this.produktionslinienDaten}`);

    this.ladeAktivesProjekt(); 
    this.initFocusOnInputField();
    this.cdr.detectChanges();

    // Aktualisierung der Uhrzeit jede Sekunde
    this.updateIntervalId = setInterval(() => this.updateDateTime(), 1000);
    // Lade aktives Projekt alle 6 Sekunden
   

    // Prüfung auf Samstag
    Promise.resolve().then(() => {
      const today = new Date();
      if (today.getDay() === 6) {
        this.schichtAusgewaehlt = true;
      }
    });
  }
  private intervalId: any;

  private updateIntervalId: any;
  private aktivesProjektIntervalId: any;
  ngOnDestroy(): void {
    // Bereinigen der Intervalle
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }
    if (this.aktivesProjektIntervalId) {
      clearInterval(this.aktivesProjektIntervalId);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  initFocusOnInputField() {
    this.focusListener = this.renderer.listen('window', 'click', () => {
      this.inputField.nativeElement.focus();
    });
  }
  private ladeAktivesProjekt() {
    this.http.get<any>(`http://kmapp.prestigepromotion.de:3002/aktives-projekt/${this.produktionslinienDaten}`,this.httpOptions ).subscribe(projekt => {
      if (projekt) {
        this.PpArfrag = projekt.Auftrag;
        this.Bezeichnung = 'Produktbezeichnung'; 
        this.sollmenge = 'Menge'; 
        this.aktuelleSchicht=projekt.arbeitsschicht
        this.aktiveMitarbeiter = projekt.mitarbeiter.map((mitarbeiter: Mitarbeiter) => {
         // console.log(projekt)
          if(projekt.arbeitsschicht=="Frühschicht"||projekt.arbeitsschicht=="Spätschicht"||projekt.arbeitsschicht=="Tagschicht"||projekt.arbeitsschicht=="Samstagschicht" ){this.schichtAusgewaehlt = true;}else{this.schichtAusgewaehlt = false;}
          return {
            ...mitarbeiter,
            status: this.bestimmeAktuellenStatus(mitarbeiter)
          };
        });        // Konvertieren Sie die aus der Datenbank kommende Zeitangabe in ein Date-Objekt
        this.projektStartzeit = new Date(projekt.startzeit);
        this.scanAuftrag( this.PpArfrag);
        setInterval(() => {
          this.aktivSeit = this.berechneAktivSeit();
        }, 1000);
      }
    });
  }
  private bestimmeAktuellenStatus(mitarbeiter: Mitarbeiter): string {
    const offeneProduktionszeit = mitarbeiter.Produktionszeit.find(zeit => !zeit.ende);
    const offeneRuestzeit = mitarbeiter.Ruestzeit.find(zeit => !zeit.ende);
    const offeneWartezeit = mitarbeiter.Wartezeit.find(zeit => !zeit.ende);
  
    if (offeneProduktionszeit) {
      this.istProduktionszeit = true;
      return 'Produktionszeit';
    }
    if (offeneRuestzeit) {
      this.istProduktionszeit = false; // Oder was auch immer der Zustand sein soll, wenn der Mitarbeiter in Rüstzeit ist
      return 'Ruestzeit';
    }
    if (offeneWartezeit) {
      this.istProduktionszeit = false;
      return 'Wartezeit';
    }
    return 'Abgemeldet'; // Oder einen anderen Standardstatus
  }
  
  formatierteProjektStartzeit!:string;
  lokalesJetzt!:string;
  private berechneAktivSeit(): string {
    if (!this.projektStartzeit) return '';
  
    const jetzt = new Date();
    const differenz = jetzt.getTime() - this.projektStartzeit.getTime();
  
    // Konvertieren der Zeiten in deutsche Lokalisierung
    const lokaleStartzeit = this.projektStartzeit.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
    const lokalesJetzt = jetzt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
    this.formatierteProjektStartzeit =lokaleStartzeit;
    this.lokalesJetzt =lokalesJetzt;
    const stunden = Math.floor(differenz / (1000 * 60 * 60));
    const minuten = Math.floor((differenz / (1000 * 60)) % 60);
    const sekunden = Math.floor((differenz / 1000) % 60);
  
    return `${stunden} Stunden ${minuten} Minuten ${sekunden} Sekunden `;
  }
  currentDate!: string;
  currentTime!: string;
  private updateDateTime(): void {
    const now = new Date();
    this.currentDate = now.toLocaleDateString();
    this.currentTime = now.toLocaleTimeString();
  }
  private inputSubject = new Subject<string>();
  handleInputChange(inputValue: string) {
    this.inputValue = inputValue;
    this.inputChanged.next(inputValue);
    this.inputSubject.next(inputValue);
  }
currentProjektId!: string;
Mitarbeiter: Mitarbeiter[] = [];

private sendData(inputValue: string) {
  let daten: DataToSend = {
    typ: this.bestimmeDatentyp(inputValue),
    inputValue: inputValue,
    produktionslinie: this.produktionslinienDaten,
    Auftrag: this.auftrag
  };

 // console.log(daten);

  switch (daten.typ) {
    case 'Mitarbeiter':
      this.verarbeiteMitarbeiterDaten(daten, inputValue);
      break;
    case 'Auftrag':
      this.verarbeiteAuftragsDaten(daten);
      break;
    default:
      console.error('Unbekannter Datentyp');
  }
}

private bestimmeDatentyp(inputValue: string): string {
  if (inputValue.startsWith('Name')) return 'Mitarbeiter';
  if (inputValue.startsWith('Pr.')) return 'Auftrag';
  else{
    this.resetInput();
    //this.aktualisiereSeite();
    return 'Unbekannt'};
}

private verarbeiteMitarbeiterDaten(daten: DataToSend, inputValue: string) {
  daten.projektId = this.currentProjektId;
  daten.status = this.status;

  const mitarbeiterName = this.extrahiereMitarbeiterName(inputValue);
 // console.log(mitarbeiterName);

  const mitarbeiterExistiert = this.aktiveMitarbeiter.some(mitarbeiter => mitarbeiter.name === mitarbeiterName);

  if (mitarbeiterExistiert) {
    this.sendRequestToBackend(mitarbeiterName);
    this.resetInput();
    //this.aktualisiereSeite();
  }if (!mitarbeiterExistiert){
    this.aktiveMitarbeiter.push({
      name: mitarbeiterName,
      status: this.status,
      istProjektleiter: false,
      anmeldezeit: new Date(), // Beispielwert
      Produktionszeit: [],    // Beispielwert
      Ruestzeit: [],          // Beispielwert
      Wartezeit: [],          // Beispielwert
      // Fügen Sie weitere notwendige Eigenschaften hinzu
    });
    
    this.sendRequest(daten);
    this.resetInput();
    //this.aktualisiereSeite();
  }
}

private extrahiereMitarbeiterName(inputValue: string): string {
  return inputValue.split(',')[0].split(': ')[1].trim();
}

private verarbeiteAuftragsDaten(daten: DataToSend) {
  daten.Auftrag = daten.inputValue;
  //this.scanAuftrag(daten.inputValue);
  this.prüfeAktivenAuftrag(daten);
}

private prüfeAktivenAuftrag(daten: DataToSend) {
  this.checkAktiverAuftrag(daten).then(response => {
    if (response.existiertAktiverAuftrag) {
      // Wenn ein aktiver Auftrag existiert, zeigen Sie den Dialog an
      const dialogRef = this.dialog.open(AuftragsDetailsModalComponent, {
        width: '450px',
        data: response.auftragsDetails
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Nur senden, wenn der Benutzer im Dialog "Bestätigen" wählt
          this.neueauftrag(daten);
          this.scanAuftrag(daten.inputValue);
          this.resetInput();
        }
        else{this.resetInput();}
      });
    } else {
      // Wenn kein aktiver Auftrag existiert, senden Sie die Anfrage direkt
      this.sendRequest(daten);
      this.scanAuftrag(daten.inputValue);
    }
  }).catch(error => {
    console.error('Fehler beim Überprüfen des aktiven Auftrags:', error);
    // Optional: Behandeln Sie den Fehlerfall, z.B. mit einer Benutzerbenachrichtigung
  });
}

private sendRequest(daten: DataToSend) {
  this.http.post('http://kmapp.prestigepromotion.de:3002/data', daten ,this.httpOptions)
    .subscribe({
      next: (response: any) => {
        this.handleErfolgreicheAntwort(response, daten);
        this.aktualisiereSeite();
      },
      error: (error) => {
        this.handleFehlerAntwort(error);
      }
    });
}
private aktualisiereSeite() {
  this.ladeAktivesProjekt(); 
}
private neueauftrag(daten: DataToSend) {
  this.http.post(`http://kmapp.prestigepromotion.de:3002/neuerAuftragMitarbeiter/${this.produktionslinienDaten}`,daten,this.httpOptions)
    .subscribe({
      next: (response: any) => {
        this.handleErfolgreicheAntwort(response, daten);
        this.aktualisiereSeite();
      },
      error: (error) => {
        this.handleFehlerAntwort(error);
      }
    });
}

private handleErfolgreicheAntwort(response: any, daten: DataToSend) {
  this.feedbackMessage = `Daten erfolgreich gespeichert.`;
  this.currentProjektId = response.id;
  if (daten.typ === 'Mitarbeiter') {
    // Aktualisieren der Projekt-ID für Mitarbeiter
  }
  this.resetInput();
  //this.aktualisiereSeite();
}

private handleFehlerAntwort(error: any) {
  this.feedbackMessage = 'Fehler beim Speichern der Daten.';
  console.error('Fehler beim Senden der Daten:', error);
  this.resetInput();
  //this.aktualisiereSeite();
}

private resetInput() {
  this.inputValue = '';
  this.initFocusOnInputField();
}


private sendRequestToBackend(mitarbeiterName: string): Observable<any> {
  // URL des Endpunkts mit Einbeziehung der produktionslinienDaten
  const url = `http://kmapp.prestigepromotion.de:3002/checkMitarbeiter/${this.produktionslinienDaten}`;

  // Daten, die im Body der Anfrage gesendet werden
  const dataToSend = {
    mitarbeiterName: mitarbeiterName,
    status: this.status
  };

  // Senden einer POST-Anfrage an das Backend
  return this.http.post(url, dataToSend, this.httpOptions)
   
}


async checkAktiverAuftrag(daten: any): Promise<any> {
  try {
    const url = 'http://kmapp.prestigepromotion.de:3002/check-aktiver-auftrag';

    let params = new HttpParams();
    if (daten.produktionslinie) {
      params = params.set('produktionslinie', daten.produktionslinie);
    }
    if (daten.Auftrag) {
      params = params.set('Auftrag', daten.inputValue);
    }

    // Erweitern der httpOptions, um die params einzuschließen
    const options = {
      ...this.httpOptions,
      params: params
    };

    const response = await this.http.get<any>(url, options).toPromise();
    return response;
  } catch (error) {
    console.error('Fehler beim Überprüfen des aktiven Auftrags:', error);
    return { existiertAktiverAuftrag: false };
  }
}

  
  

  Bezeichnung!:string;
  sollmenge!:string;
  PpArfrag!:string;
  private scanAuftrag(auftragsnummer: string) {
    this.http.get<any>(`http://kmapp.prestigepromotion.de:3002/auftrag-details/${auftragsnummer}`,this.httpOptions)
      .subscribe({
        next: (response) => {
          this.PpArfrag=response.auftragsDetails.auftragsnr;
           this.Bezeichnung=response.auftragsDetails.fpbezeichnung;
          this.sollmenge=response.auftragsDetails.sollmenge;
         // console.log('auftrag-details',response)
        
          
        },
        error: (error) => {
          console.error('Fehler beim Abrufen der Auftragsdetails:', error);
          // Fehlerbehandlung...
        }
      });
      this.cdr.detectChanges();
  }





  aktualisiereSchicht(produktionslinienDaten: string, schicht: string) {
    return this.http.patch(`http://kmapp.prestigepromotion.de:3002/projekt/${produktionslinienDaten}/schicht`, { arbeitsschicht: schicht },this.httpOptions);
  }
  

  aktuelleSchicht: string = ''; // Variable zum Speichern der aktuellen Schicht

  // ... bestehende Methoden und Logik...

  waehleSchicht(schicht: string) {
    const bestaetigung = confirm(`${schicht} einstellen?`); // Bestätigungsdialog
    if (bestaetigung) {
      this.aktualisiereSchicht(this.produktionslinienDaten, schicht)
        .subscribe({
          next: (response) => {
            //console.log('Schicht erfolgreich aktualisiert', response);
            this.schichtAusgewaehlt = true;
            this.aktuelleSchicht = schicht; // Aktuelle Schicht speichern
          },
          error: (error) => {
            console.error('Fehler beim Aktualisieren der Schicht', error);
            this.schichtAusgewaehlt = false;
          }
        });
    }
  }
  



  
}
