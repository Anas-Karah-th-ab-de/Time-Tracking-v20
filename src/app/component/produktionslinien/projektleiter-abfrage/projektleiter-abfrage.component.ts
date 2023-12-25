import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-projektleiter-abfrage',
  templateUrl: './projektleiter-abfrage.component.html',
  styleUrl: './projektleiter-abfrage.component.css'
})
export class ProjektleiterAbfrageComponent implements AfterViewInit {
  @ViewChild('qrCodeInput') qrCodeInput!: ElementRef;
  qrCodeInputSubject = new Subject<string>();
  qrCode: string = '';

  constructor(public dialogRef: MatDialogRef<ProjektleiterAbfrageComponent>) {}

  ngAfterViewInit() {
    this.qrCodeInput.nativeElement.focus();
    this.qrCodeInputSubject.pipe(
      debounceTime(1000) // 1000 Millisekunden Verzögerung
    ).subscribe((qrCode) => {
      this.verarbeiteQrCode(qrCode);
    });
  }

  handleQrCodeInput() {
    this.qrCodeInputSubject.next(this.qrCode);
  }
  verarbeiteQrCode(aktuellerQrCode: string) {
    if (aktuellerQrCode && typeof aktuellerQrCode === 'string') {
      const qrCodeTeile = aktuellerQrCode.trim().split(', ');
  
      if (aktuellerQrCode) {
        
          this.speichereQrCodeUndErmittleName(aktuellerQrCode).then(projektleiterName => {
            try {
              const qrCodeTeile = aktuellerQrCode.split(', ');
              if (qrCodeTeile.length === 2) {
                // Erwarten des Formats "Name: [Name]" für den ersten Teil
                const nameTeil = qrCodeTeile[0].split(': ');
                // Erwarten des Formats "Projektleiter: [ja/nein]" für den zweiten Teil
                const projektleiterTeil = qrCodeTeile[1].split(': ');
  
                if (nameTeil.length === 2 && projektleiterTeil.length === 2) {
                  const name = nameTeil[1].trim();
                  const istProjektleiter = projektleiterTeil[1].trim().toLowerCase() === 'ja';
  
                  if (istProjektleiter) {
                    this.dialogRef.close(name);
                  } else {
                    console.error('Person ist kein Projektleiter.');
                  }
                } else {
                  console.error('QR-Code-Format ist ungültig.');
                }
              } else {
                console.error('QR-Code-Format ist ungültig.');
              }
            } catch (e) {
              console.error('Fehler beim Verarbeiten des QR-Codes:', e);
            }
            this.qrCode = '';
          });
       
      }
    }
  }
  
  
  

  async speichereQrCodeUndErmittleName(qrCode: string): Promise<string> {
    // Implementieren Sie hier die Logik zum Speichern des QR-Codes
    // und zum Ermitteln des Namens des Projektleiters
    // ...
    return 'Projektleiter Name'; // Beispiel-Rückgabe
  }
}
