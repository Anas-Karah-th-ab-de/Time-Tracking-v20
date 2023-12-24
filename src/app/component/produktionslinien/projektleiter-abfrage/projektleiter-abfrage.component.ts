import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-projektleiter-abfrage',
  templateUrl: './projektleiter-abfrage.component.html',
  styleUrl: './projektleiter-abfrage.component.css'
})
export class ProjektleiterAbfrageComponent implements AfterViewInit {
  @ViewChild('qrCodeInput') qrCodeInput!: ElementRef;

  ngAfterViewInit() {
    this.qrCodeInput.nativeElement.focus();
  }
  qrCode: string = '';
  constructor(
    public dialogRef: MatDialogRef<ProjektleiterAbfrageComponent>
  ) {}

  handleQrCodeScan() {
    if (this.qrCode) {
      this.speichereQrCodeUndErmittleName(this.qrCode).then(projektleiterName => {
        const qrCodeTeile = this.qrCode.split(', ');
        const name = qrCodeTeile[0].split(': ')[1];
        const istProjektleiter = qrCodeTeile[1].split(': ')[1] === 'ja';
    
        if (istProjektleiter) {
          // Schließen des Dialogs und Rückgabe des Projektleiter-Namens
          this.dialogRef.close(name);
        } else {
          // Logik für den Fall, dass kein gültiger Projektleiter-Name ermittelt wurde
          console.error('Projektleiter-Name konnte nicht ermittelt werden.');
          // Optional: Nachricht an den Benutzer, dass der QR-Code ungültig ist
        }
        this.qrCode = '';
      });
    }
  }

  async speichereQrCodeUndErmittleName(qrCode: string): Promise<string> {
    // Implementieren Sie hier die Logik zum Speichern des QR-Codes
    // und zum Ermitteln des Namens des Projektleiters
    // ...
    return 'Projektleiter Name'; // Beispiel-Rückgabe
  }
}
