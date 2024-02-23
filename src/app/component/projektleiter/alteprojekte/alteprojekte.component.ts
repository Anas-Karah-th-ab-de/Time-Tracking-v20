import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-alteprojekte',
  templateUrl: './alteprojekte.component.html',
  styleUrl: './alteprojekte.component.css'
})

export class AlteprojekteComponent implements OnInit {
  projekte: any[] = [];
  gefilterteProjekte: any[] = [];
  filterText: string = '';
  ausgewaehltesProjekt: any = null;
  private baseUrl = 'http://kmapp.prestigepromotion.de:3002';
  aktuellesDatum: string;
  readonly httpOptions = {
    headers: new HttpHeaders({
      'PrestigePromotion': 'MA-Ak-KM-Idlib-+963-023'
    })
  };
  constructor(private router: Router,private route: ActivatedRoute,private http: HttpClient) {
    const heute = new Date();
    this.aktuellesDatum = heute.toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
  }
  projektleiter!:string;
  getNichtAktiveProjekte(): Observable<any> {
    return this.http.get(`${this.baseUrl}/projekte/nichtAktiv/alt`, this.httpOptions);
  }
  ngOnInit(): void {
    // Holen Sie den projektleiter-Wert aus der Route
    this.projektleiter = this.route.snapshot.paramMap.get('projektleiter') || '';
   // console.log('Projektleiter:', this.projektleiter);
  
    // Setzen Sie den mitarbeiterFilter auf den Wert von projektleiter
    this.mitarbeiterFilter = this.projektleiter;
  
    // Laden Sie die Projekte und wenden Sie den Filter an
    this.getNichtAktiveProjekte().subscribe(
      data => {
     //   console.log('Erhaltene Projekte:', data);
  
        // Berechnen Sie das Datum von vor 5 Tagen
  
  
        // Filtern Sie die Projekte, die nicht aktiv sind und älter als 5 Tage
        this.projekte = data.filter((projekt: any) => this.filterAlterAlsFunfTage(projekt));

  
       
  
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
  
    // Rolle direkt als 'Tablet' zuweisen
    const userRole = 'Projektleiter';
  
    // Parameter für die Navigation
    const navigationExtras = {
      queryParams: {
        produktionslinie: this.ausgewaehltesProjekt.produktionslinie,
        auftrag: this.ausgewaehltesProjekt.Auftrag,
        datum: this.ausgewaehltesProjekt.startzeit, // oder ein anderes relevantes Datum
        rolle: userRole // Rolle direkt in die Query-Parameter einfügen
      }
    };
 // console.log(navigationExtras)
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
  filterAlterAlsFunfTage(projekt: any): boolean {
    if (!projekt.startzeit) {
      return false;
    }
  
    const startzeitFormatiert = new Date(projekt.startzeit).toISOString().split('T')[0];
    let funfTageZuruck = new Date();
    funfTageZuruck.setDate(funfTageZuruck.getDate() - 5);
    const funfTageZuruckFormatiert = funfTageZuruck.toISOString().split('T')[0];
  
    return startzeitFormatiert > funfTageZuruckFormatiert;
  }
  
  
  

  filterByMitarbeiter(projekt: any): boolean {
    if (!this.mitarbeiterFilter) return true; // Wenn kein Filtertext vorhanden ist, alle Projekte anzeigen
   
    return projekt.mitarbeiter.some((mitarbeiter: any) => 
      mitarbeiter.name.toLowerCase().includes(this.mitarbeiterFilter.toLowerCase())
    );
  }
  

  
  applyFilter(): void {
    this.gefilterteProjekte = this.projekte.filter(projekt => 
      (this.filterByAuftrag(projekt) ||
      this.filterByProduktionslinie(projekt)) &&
      this.filterByMitarbeiter(projekt) 
    );
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
interface Projekt {
  startzeit: string; // und andere relevante Felder
  // ...
}