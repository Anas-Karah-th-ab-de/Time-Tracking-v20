import { Component, ElementRef, ViewChild, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { interval } from 'rxjs';
@Component({
  selector: 'app-personalschleuse',
  templateUrl: './personalschleuse.component.html',
  styleUrls: ['./personalschleuse.component.css']
})
export class PersonalschleuseComponent implements OnInit {
  @ViewChild('qrCodeInput') qrCodeInput!: ElementRef<HTMLInputElement>;
  qrCodeInputSubject = new Subject<string>();
  showAbmeldung = false;
  abgemeldeterMitarbeiter = '';
  abmeldezeit!: Date;
  abmeldezeitde!: string;
  aktuelleZeit: string = '';

  constructor(private http: HttpClient) { interval(1000).subscribe(() => {
    this.aktuelleZeit = new Date().toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  });
}

  ngOnInit() {
    this.setFocusOnInput();
    this.qrCodeInputSubject.pipe(
      debounceTime(1000) // Warten auf 1 Sekunde der Inaktivität
    ).subscribe(qrCode => {
      this.handleQrCodeInput(qrCode);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.setFocusOnInput();
  }

  private setFocusOnInput() {
    setTimeout(() => this.qrCodeInput.nativeElement.focus(), 0);
  }

  handleInputChange(value: string) {
    this.qrCodeInputSubject.next(value);
  }
  private handleQrCodeInput(qrCode: string) {
    // Extrahieren des Namens aus dem QR-Code
    // Angenommen, der Name steht direkt im QR-Code-String
    const qrCodeTeile = qrCode.split(', ');
  
      // Erwarten des Formats "Name: [Name]" für den ersten Teil
      const nameTeil = qrCodeTeile[0].split(': ');
  
    const nameMatch = qrCode.match(/(?:Name: )?(.+)/);
   
  
    if (nameMatch) {
      const mitarbeiterName = nameTeil[1].trim();
      console.log(mitarbeiterName);
      // Senden der Anfrage an das Backend
      this.http.post<any>('http://192.168.100.1:3002/api/abmeldung', { mitarbeiterName }).subscribe(response => {
        // Verarbeiten der Antwort
        this.abgemeldeterMitarbeiter = response.mitarbeiterName;
        this.abmeldezeit = new Date(response.abmeldezeit);
        this.abmeldezeitde=new Date(this.abmeldezeit).toLocaleString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        this.showAbmeldung = true;
  
        setTimeout(() => {
          this.showAbmeldung = false;
          this.qrCodeInput.nativeElement.value = '';
          this.qrCodeInput.nativeElement.focus();
        }, 5000); // Anzeige für 5 Sekunden
      }, error => {
        console.error('Fehler bei der Abmeldung', error);
        this.qrCodeInput.nativeElement.value = '';
      });
    } else {
      console.error('Ungültiger QR-Code');
      this.qrCodeInput.nativeElement.value = '';
    }
  }
}