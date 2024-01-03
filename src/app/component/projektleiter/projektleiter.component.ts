import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
@Component({
  selector: 'app-projektleiter',
  templateUrl: './projektleiter.component.html',
  styleUrls: ['./projektleiter.component.css']
})
export class ProjektleiterComponent implements OnInit {
  projekte: any[] = [];
  gefilterteProjekte: any[] = [];
  filterText: string = '';
  ausgewaehltesProjekt: any = null;
  private baseUrl = 'http://192.168.100.1:3002';
  aktuellesDatum: string;
  constructor(private router: Router,private route: ActivatedRoute,private http: HttpClient) {
    const heute = new Date();
    this.aktuellesDatum = heute.toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
  }
  projektleiter!:string;
  getNichtAktiveProjekte(): Observable<any> {
    return this.http.get(`${this.baseUrl}/projekte/nichtAktiv`);
  }
  ngOnInit(): void {
    // Holen Sie den projektleiter-Wert aus der Route
    this.projektleiter = this.route.snapshot.paramMap.get('projektleiter') || '';
    console.log(this.projektleiter);
  
    // Setzen Sie den mitarbeiterFilter auf den Wert von projektleiter
    this.mitarbeiterFilter = this.projektleiter;
  
    // Laden Sie die Projekte und wenden Sie den Filter an
    this.getNichtAktiveProjekte().subscribe(
      data => {
        this.projekte = data;
        this.gefilterteProjekte = data;
  
        // Wenden Sie den Filter unmittelbar nach dem Laden der Projekte an
        this.applyFilter(); 
      },
      error => console.error(error)
    );
  }
  

  onSelectProjekt(projekt: any): void {
    this.ausgewaehltesProjekt = projekt;
  }

  onBearbeiten(): void {
    if (!this.ausgewaehltesProjekt) {
      console.log('Kein Projekt ausgewählt');
      return;
    }
    
    // Pfad zur Detailkomponente, z. B. '/projektdetails'
    const detailPath = '/projektdetails';
  
    // Parameter für die Navigation
    const navigationExtras = {
      queryParams: {
        produktionslinie: this.ausgewaehltesProjekt.produktionslinie,
        auftrag: this.ausgewaehltesProjekt.Auftrag,
        datum: this.ausgewaehltesProjekt.startzeit // oder ein anderes relevantes Datum
      }
    };
  
    // Navigieren zur Detailkomponente mit den Parametern
    this.router.navigate([detailPath], navigationExtras);
  }
  mitarbeiterFilter: string =  '';
  filterByAuftrag(projekt: any): boolean {
    if (!this.filterText) return true;
    return projekt.Auftrag.toLowerCase().includes(this.filterText.toLowerCase());
  }

  filterByProduktionslinie(projekt: any): boolean {
    if (!this.filterText) return true;
    return projekt.produktionslinie.toLowerCase().includes(this.filterText.toLowerCase());
  }



  filterByMitarbeiter(projekt: any): boolean {
    if (!this.mitarbeiterFilter) return true; // Wenn kein Filtertext vorhanden ist, alle Projekte anzeigen
   
    return projekt.mitarbeiter.some((mitarbeiter: any) => 
      mitarbeiter.name.toLowerCase().includes(this.mitarbeiterFilter.toLowerCase())
    );
  }
  
  filterByDatum(projekt: any): boolean {
    // Konvertieren Sie Datumswerte in das Format 'YYYY-MM-DD'
    const startzeitFormatiert = projekt.startzeit ? new Date(projekt.startzeit).toISOString().split('T')[0] : null;
    const endzeitFormatiert = projekt.endzeit ? new Date(projekt.endzeit).toISOString().split('T')[0] : null;
  
    return startzeitFormatiert === this.aktuellesDatum || endzeitFormatiert === this.aktuellesDatum;
  }
  
  applyFilter(): void {
    this.gefilterteProjekte = this.projekte.filter(projekt => 
      (this.filterByAuftrag(projekt) ||
      this.filterByProduktionslinie(projekt)) &&
      this.filterByMitarbeiter(projekt) &&
      this.filterByDatum(projekt)
    );
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
