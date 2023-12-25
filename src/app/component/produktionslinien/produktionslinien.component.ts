import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
interface DataToSend {
  typ: string;
  inputValue: string;
  projektId?: string;
  produktionslinie: string; // Zusätzliches Feld für die Produktionslinie
  status?: string;
 // _id:string;
  Auftrag:string;
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
export class ProduktionslinienComponent implements AfterViewInit {
  @ViewChild('inputField') inputField!: ElementRef;
  
  projektStartzeit: Date | null = null; // Startzeit des Projekts             // Speichert die Startzeit des Projekts
  aktivSeit: string = '';              // Speichert die Dauer, wie lange das Projekt aktiv ist
  aktiveMitarbeiter: Mitarbeiter[] = [];
  inputValue: string = '';
  feedbackMessage: string = '';
  auftrag: string = '';
  private inputChanged = new Subject<string>();
  private focusListener: Function | null = null;
  constructor(private route: ActivatedRoute,private cdr: ChangeDetectorRef, private renderer: Renderer2, public dialog: MatDialog, private http: HttpClient,private dataSharingService: DataSharingService) {
    this.inputChanged.pipe(
      debounceTime(1000)  // 1000 Millisekunden Wartezeit
    ).subscribe(inputValue => {
      this.sendData(inputValue);
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
          console.log(this.projektleiterName)
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
        console.log( this.aktiveMitarbeiter)
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

  sd(){
    this.aktiveMitarbeiter.forEach(mitarbeiter => {
      // Update the status locally
console.log(this.produktionslinienDaten)
      // Send request to backend to update the status
      this.http.put(`http://localhost:3002/aktualisiereStatus/${this.produktionslinienDaten}`, {
        mitarbeiterName: mitarbeiter.name,
        neueAktivitaet: mitarbeiter.status
      }).subscribe({
        next: (response) => console.log(response),
        error: (error) => console.error('Fehler beim Aktualisieren des Mitarbeiterstatus:', error)
      });
    });
  }
  produktionslinienDaten!: string;
  ngAfterViewInit() {
    this.produktionslinienDaten = this.route.snapshot.paramMap.get('linie') || 'defaultWert';
    
    this.ladeAktivesProjekt();
    //this.produktionslinienDaten = this.dataSharingService.getProduktionslinienDaten();
 
    this.initFocusOnInputField();
    this.cdr.detectChanges();
    setInterval(() => this.updateDateTime(), 1000);
 
  }
  initFocusOnInputField() {
    this.focusListener = this.renderer.listen('window', 'click', () => {
      this.inputField.nativeElement.focus();
    });
  }
  private ladeAktivesProjekt() {
    this.http.get<any>(`http://localhost:3002/aktives-projekt/${this.produktionslinienDaten}`).subscribe(projekt => {
      if (projekt) {
        this.PpArfrag = projekt.Auftrag;
        this.Bezeichnung = 'Produktbezeichnung'; // Fügen Sie Logik hinzu, um diese Daten zu erhalten
        this.sollmenge = 'Menge'; // Fügen Sie Logik hinzu, um diese Daten zu erhalten
        this.aktiveMitarbeiter = projekt.mitarbeiter;
        // Konvertieren Sie die aus der Datenbank kommende Zeitangabe in ein Date-Objekt
        this.projektStartzeit = new Date(projekt.startzeit);
  
        setInterval(() => {
          this.aktivSeit = this.berechneAktivSeit();
        }, 1000);
      }
    });
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

  handleInputChange(inputValue: string) {
    this.inputValue = inputValue;
    this.inputChanged.next(inputValue);
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

  console.log(daten);

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
    return 'Unbekannt'};
}

private verarbeiteMitarbeiterDaten(daten: DataToSend, inputValue: string) {
  daten.projektId = this.currentProjektId;
  daten.status = this.status;

  const mitarbeiterName = this.extrahiereMitarbeiterName(inputValue);
  console.log(mitarbeiterName);

  const mitarbeiterExistiert = this.aktiveMitarbeiter.some(mitarbeiter => mitarbeiter.name === mitarbeiterName);

  if (mitarbeiterExistiert) {
    this.sendRequestToBackend(mitarbeiterName);
    this.resetInput();
  } else {
    this.aktiveMitarbeiter.push({ name: mitarbeiterName, status: this.status, istProjektleiter: false });
    this.sendRequest(daten);
    this.resetInput();
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
          this.sendRequest(daten);
          this.scanAuftrag(daten.inputValue);
        }
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
  this.http.post('http://localhost:3002/data', daten)
    .subscribe({
      next: (response: any) => {
        this.handleErfolgreicheAntwort(response, daten);
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
}

private handleFehlerAntwort(error: any) {
  this.feedbackMessage = 'Fehler beim Speichern der Daten.';
  console.error('Fehler beim Senden der Daten:', error);
  this.resetInput();
}

private resetInput() {
  this.inputValue = '';
  this.initFocusOnInputField();
}


  private sendRequestToBackend(mitarbeiterName: string) {
    // URL des Endpunkts mit Einbeziehung der produktionslinienDaten
    const url = `http://localhost:3002/checkMitarbeiter/${this.produktionslinienDaten}`;

    // Daten, die im Body der Anfrage gesendet werden
    const dataToSend = {
        mitarbeiterName: mitarbeiterName,
        status :this.status
    };

    // Senden einer POST-Anfrage an das Backend
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Erfolgreich gesendet:', data);
    })
    .catch(error => {
        console.error('Fehler beim Senden der Daten:', error);
    });
}


  async checkAktiverAuftrag(daten: DataToSend): Promise<any> {
    console.log(daten)
    try {
      const url = 'http://localhost:3002/check-aktiver-auftrag';
  
      let params = new HttpParams();
      if (daten.produktionslinie) {
        params = params.set('produktionslinie', daten.produktionslinie);
      }
      if (daten.Auftrag) {
        params = params.set('Auftrag', daten.inputValue);
        console.log(params)
      }
  
      // Beachten Sie, dass der Typ hier nicht mehr `boolean` ist, sondern `any` oder ein spezifischer Typ, der Ihrer Antwortstruktur entspricht
      const response = await this.http.get<any>(url, { params }).toPromise();
      console.log('checkAktiverAuftrag',response)
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
    this.http.get<any>(`http://localhost:3002/auftrag-details/${auftragsnummer}`)
      .subscribe({
        next: (response) => {
          this.PpArfrag=response.auftragsDetails.auftragsnr;
           this.Bezeichnung=response.auftragsDetails.fpbezeichnung;
          this.sollmenge=response.auftragsDetails.sollmenge;
          console.log('auftrag-details',response)
          
        },
        error: (error) => {
          console.error('Fehler beim Abrufen der Auftragsdetails:', error);
          // Fehlerbehandlung...
        }
      });
      this.cdr.detectChanges();
  }
  
}