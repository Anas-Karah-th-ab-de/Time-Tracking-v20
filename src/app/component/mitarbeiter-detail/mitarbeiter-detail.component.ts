import { Component, OnInit } from '@angular/core';
import { MitarbeiterService } from '../../service/mitarbeiter.service';
import { NgForm } from '@angular/forms';
import { Mitarbeiter } from '../../model/mitarbeiter.model';
import { QrCodeDialogComponent } from '../qr-code-dialog/qr-code-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mitarbeiter-detail',
  templateUrl: './mitarbeiter-detail.component.html',
  styleUrl: './mitarbeiter-detail.component.css'
})
export class MitarbeiterDetailComponent implements OnInit {
  bearbeitenderMitarbeiter: Mitarbeiter = {
    _id: '',
    name: '',
    projektleiter: false,
    MitarbeiterNummer: '',
    stueckanzahl:0
  };

  constructor(
    private router: Router,
    public dialog: MatDialog, 
    private mitarbeiterService: MitarbeiterService, 
    private route: ActivatedRoute
  ) { }
  ngOnInit(): void {
    this.mitarbeiterService.getBearbeitenderMitarbeiter().subscribe(mitarbeiter => {
      if (mitarbeiter) {
        this.bearbeitenderMitarbeiter = mitarbeiter;
      } else {
        // Umgang mit Fällen, in denen kein Mitarbeiter festgelegt wurde
      }
    });
  }
  
  
  
  

  speichern(form: NgForm): void {
    if (form.valid && this.bearbeitenderMitarbeiter) {
      this.mitarbeiterService.updateMitarbeiter(this.bearbeitenderMitarbeiter._id, form.value).subscribe({
        next: (result) => {
          console.log('Mitarbeiter aktualisiert', result);
          const qrCodeText = `Name: ${form.value.name}, Projektleiter: ${form.value.projektleiter}`;
          this.dialog.open(QrCodeDialogComponent, {
            width: '400px',
            data: { qrCodeText: qrCodeText }
          });
        },
        error: (err) => console.error('Fehler beim Aktualisieren des Mitarbeiters:', err)
      });
    }
  }
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}