import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { DataSharingService } from '../../service/data-sharing.service';
import { forkJoin } from 'rxjs';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-projektleiter',
  templateUrl: './projektleiter.component.html',
  styleUrls: ['./projektleiter.component.css']
})
export class ProjektleiterComponent implements OnInit {
  displayedColumns: string[] = ['auftrag', 'kunde', 'produktionslinie', 'startzeit', 'endzeit', 'mitarbeiter', 'aktionen'];
  toggleAusgewaehltesProjekt(row: any): void {
    this.ausgewaehltesProjekt = this.ausgewaehltesProjekt === row ? null : row;
  }
  getMitarbeiterNamen(projekt:any): string {
    return projekt.mitarbeiter.map((m:any) => m.name).join(', ');
  }
  filterText: string = '';
  projekte: any[] = [];
  gefilterteProjekte: any[] = [];
  auftrag: string = '';
  produktionsline: string = '';
  ausgewaehltesProjekt: any = null;
  private baseUrl = 'http://kmapp.prestigepromotion.de:3002';
  aktuellesDatum: string;
  constructor(
    private titleService: Title,
    private dataSharingService: DataSharingService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient) {
    const heute = new Date();
    this.aktuellesDatum = heute.toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
  }
  projektleiter!:string;
  readonly httpOptions = {
    headers: new HttpHeaders({
      'PrestigePromotion': 'MA-Ak-KM-Idlib-+963-023'
    })
  };
  getNichtAktiveProjekte(): Observable<any> {
    return this.http.get(`${this.baseUrl}/projekte/nichtAktiv`,this.httpOptions);
  }
  ngOnInit(): void {
    this.titleService.setTitle('Fertige Stundenzettel');
    // Holen Sie den projektleiter-Wert aus der Route
    this.projektleiter = this.route.snapshot.paramMap.get('projektleiter') || '';
    console.log(this.projektleiter);
  
    // Setzen Sie den mitarbeiterFilter auf den Wert von projektleiter
    this.mitarbeiterFilter = this.projektleiter;
  
    // Laden Sie die Projekte und wenden Sie den Filter an
    forkJoin({
      orderData: this.dataSharingService.getoreder(),
      projectData: this.getNichtAktiveProjekte()
    }).subscribe({
      next: ({ orderData, projectData }) => {
        // Schritt 1: Erstellen eines Sets von Auftragsnummern aus projectData
        // Ensure projectData is not undefined and Auftrag property exists
        const auftragsnummernSet = new Set(projectData.map((projekt: any) => projekt.Auftrag ? projekt.Auftrag.replace('Pr.', '').trim() : ''));
  
        // Schritt 2: Filtern von orderData, um nur relevante Aufträge zu behalten
        // Ensure orderData is not undefined
        const relevanteOrderData = orderData.filter(order => auftragsnummernSet.has(order.auftragsnr));
  
        // Schritt 3: Ergänzen der Projektdaten mit den entsprechenden Auftragsdaten
        // Ensure each project has an Auftrag before replacing
        this.projekte = projectData.map((projekt: any) => {
          const auftragsnummerOhnePr = projekt.Auftrag ? projekt.Auftrag.replace('Pr.', '').trim() : '';
          const matchingOrder = relevanteOrderData.find(order => order.auftragsnr === auftragsnummerOhnePr);
  
          return matchingOrder ? { ...projekt, ...matchingOrder } : projekt;
        });
  
        this.gefilterteProjekte = [...this.projekte];
        this.applyFilter();
      },
      error: error => {
        console.error('Fehler beim Abrufen der Daten', error);
      }
    });
  }
  

  onSelectProjekt(projekt: any): void {
    this.ausgewaehltesProjekt = projekt;
  }

  onBearbeiten(projekt: any, event: MouseEvent): void {
    event.stopPropagation();
    if (!projekt) {
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
        produktionslinie: projekt.produktionslinie,
        auftrag: projekt.Auftrag,
        datum: projekt.startzeit, // oder ein anderes relevantes Datum
        rolle: userRole // Rolle direkt in die Query-Parameter einfügen
      }
    };
  console.log(navigationExtras)
    // Navigieren zur Detailkomponente mit den Parametern
    this.router.navigate([detailPath], navigationExtras);
  }
  
  mitarbeiterFilter: string =  '';
  filterByAuftrag(projekt: any): boolean {
    if (!this.auftrag) return true;
    return projekt.Auftrag.toLowerCase().includes(this.auftrag.toLowerCase());
  }

  filterByProduktionslinie(projekt: any): boolean {
    if (!this.produktionsline) return true;
    return projekt.produktionslinie.toLowerCase().includes(this.produktionsline.toLowerCase());
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
      (this.filterByAuftrag(projekt) &&
      this.filterByProduktionslinie(projekt)) &&
      this.filterByMitarbeiter(projekt) &&
      this.filterByDatum(projekt)
    );
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  farbPalette = ['#FFCCBC', '#C8E6C9', '#BBDEFB', '#D1C4E9', '#FFCDD2', '#F0F4C3', '#B3E5FC']; // Dies sind Beispielfarben
  getFarbeFuerLinie(produktionslinie: string): string {
    let sum = 0;
    for (let i = 0; i < produktionslinie.length; i++) {
      sum += produktionslinie.charCodeAt(i);
    }
    return this.farbPalette[sum % this.farbPalette.length]; // Verwenden des Modulo-Operators, um einen zyklischen Effekt zu erzeugen
  }

  generateColorPalette(): string[] {
    let colors: string[] = [];
    const totalColors = 100;
    const hueStep = 360 / totalColors;
    // Adjust lightness to ensure background colors are lighter
    const lightness = 70; // Increase lightness for better contrast with black text
  
    for (let i = 0; i < totalColors; i++) {
      let hue = (i * hueStep) % 360;
      // Alternate between two levels of saturation for variety
      let saturation = ((i % 20) < 10) ? 75 : 50; // Adjusted for visual comfort
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
  
    // Optional: Shuffle the array to distribute colors randomly
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }
  
    return colors;
  }
  
  
  
  
  // Usage
  farbAuftrag: string[] = this.generateColorPalette();
  getFarbeFuerAuftrag(auftrag: string): string {
    if (!auftrag) { // Prüft, ob auftrag undefiniert oder leer ist
      return 'defaultColor'; // Geben Sie eine Standardfarbe zurück, wenn kein Auftrag vorhanden ist
    }
    let sum = 0;
    for (let i = 0; i < auftrag.length; i++) {
      sum += auftrag.charCodeAt(i);
    }
    return this.farbAuftrag[sum % this.farbAuftrag.length];
  }
  defaultColor='C8E6C9';
  
}
