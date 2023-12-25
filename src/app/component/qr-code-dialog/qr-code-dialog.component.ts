import { Component, Inject, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code-dialog',
  templateUrl: './qr-code-dialog.component.html',
  styleUrls: ['./qr-code-dialog.component.css']
})
export class QrCodeDialogComponent implements AfterViewInit {
  qrCodeDataURL!: string;
  name: string = '';
  isProjektleiter: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.parseQrCodeText(data.qrCodeText);
  }

  parseQrCodeText(qrCodeText: string): void {
    const parts = qrCodeText.split(', ');
    parts.forEach(part => {
      const [key, value] = part.split(': ');
      if (key.trim() === 'Name') {
        this.name = value.trim();
      } else if (key.trim() === 'Projektleiter') {
        this.isProjektleiter = value.trim() === 'ja';
      }
    });
  }

  ngAfterViewInit(): void {
    QRCode.toDataURL(this.data.qrCodeText, (error: any, url: string) => {
      console.log(this.data.qrCodeText)
      if (error) {
        console.error('Fehler beim Generieren des QR-Codes:', error);
      } else {
        setTimeout(() => this.qrCodeDataURL = url);
      }
    });
  }
  
  
  print(): void {
    let printStyles = `<style>
      .qr-code-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr-code {
        margin-right: 20px; /* Abstand zwischen QR-Code und Informationen */
      }
      .qr-code-info {
        text-align: left;
      }
    </style>`;
  
    let printContent = `<html>
      <head>${printStyles}</head>
      <body>
        <div class="qr-code-container">
          <img src="${this.qrCodeDataURL}" alt="QR Code" class="qr-code">
          <div class="qr-code-info">
            <h2>${this.name}</h2>
            ${this.isProjektleiter ? '<p>Projektleiter</p>' : ''}
          </div>
        </div>
      </body>
    </html>`;
  
    let printWindow = window.open('', '_blank');
    printWindow!.document.write(printContent);
    printWindow!.document.close();
    printWindow!.focus();
    printWindow!.print();
    printWindow!.close();
  }
  
  
  
}
