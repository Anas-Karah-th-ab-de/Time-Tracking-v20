import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MitarbeiterService } from '../../service/mitarbeiter.service'; 
import { Mitarbeiter } from '../../model/mitarbeiter.model';
import { QrCodeDialogComponent } from '../qr-code-dialog/qr-code-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
@Component({
  selector: 'app-mitarbeiter-liste',
  templateUrl: './mitarbeiter-liste.component.html',
  styleUrls: ['./mitarbeiter-liste.component.css']
})
export class MitarbeiterListeComponent implements OnInit {
  mitarbeiterListe = new MatTableDataSource<Mitarbeiter>([]);
  displayedColumns: string[] = ['MitarbeiterNummer','name', 'projektleiter', 'aktionen'];

  constructor(private router: Router, private mitarbeiterService: MitarbeiterService, private dialog: MatDialog) { }
  ngOnInit(): void {
    this.mitarbeiterService.getMitarbeiter().subscribe(data => {
      this.mitarbeiterListe.data = data;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.mitarbeiterListe.filter = filterValue.trim().toLowerCase();
  }
  bearbeiten(mitarbeiter: Mitarbeiter): void {
    this.mitarbeiterService.setBearbeitenderMitarbeiter(mitarbeiter);
    this.router.navigate(['/mitarbeiter-detail']);
  }
  
  

  qrCodeAnzeigen(mitarbeiter: Mitarbeiter): void {
    const qrCodeText = `Name: ${mitarbeiter.name}, Projektleiter: ${mitarbeiter.projektleiter}`;
  this.dialog.open(QrCodeDialogComponent, {
    width: '400px',
    data: { qrCodeText: qrCodeText }
  });
  }

  loeschen(mitarbeiter: Mitarbeiter): void {
    if (confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?')) {
      this.mitarbeiterService.deleteMitarbeiter(mitarbeiter._id).subscribe({
        next: () => {
          // Verwenden Sie .data, um auf das Array in MatTableDataSource zuzugreifen
          this.mitarbeiterListe.data = this.mitarbeiterListe.data.filter(m => m._id !== mitarbeiter._id);
          alert('Mitarbeiter erfolgreich gelöscht.');
        },
        error: (err) => {
          console.error('Fehler beim Löschen des Mitarbeiters:', err);
          alert('Fehler beim Löschen des Mitarbeiters.');
        }
      });
    }
  }
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  
}
