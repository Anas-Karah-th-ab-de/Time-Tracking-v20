import { Component } from '@angular/core';
import { MitarbeiterService } from '../../service/mitarbeiter.service';
import { NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { QrCodeDialogComponent } from '../qr-code-dialog/qr-code-dialog.component';
import { Router } from '@angular/router';
@Component({
  selector: 'app-mitarbeiter-erstellen',
  templateUrl: './mitarbeiter-erstellen.component.html',
  styleUrl: './mitarbeiter-erstellen.component.css'
})
export class MitarbeiterErstellenComponent {
  constructor(private router: Router,public dialog: MatDialog, private mitarbeiterService: MitarbeiterService) { }

  onSubmit(mitarbeiterForm: NgForm) {
    if (mitarbeiterForm.valid) {
      this.mitarbeiterService.addMitarbeiter(mitarbeiterForm.value).subscribe({
        next: (result) => {
          console.log('Mitarbeiter erstellt', result);
  
          // QR-Code-Text basierend darauf, ob die Person Projektleiter ist oder nicht
          let qrCodeText = `Name: ${mitarbeiterForm.value.name}`;
          if (mitarbeiterForm.value.projektleiter === 'ja') {
            qrCodeText += `, Projektleiter: ${mitarbeiterForm.value.projektleiter}`;
          }
  
          this.dialog.open(QrCodeDialogComponent, {
            width: '400px',
            data: { qrCodeText: qrCodeText }
          });
        },
        error: (error) => {
          console.error('Fehler beim Erstellen des Mitarbeiters', error);
        }
      });
    }
  }
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
