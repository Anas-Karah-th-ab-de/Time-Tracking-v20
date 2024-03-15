// data-sharing.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {
  readonly httpOptions = {
    headers: new HttpHeaders({
      'PrestigePromotion': 'MA-Ak-KM-Idlib-+963-023'
    })
  };
  private apiUrl = 'http://kmapp.prestigepromotion.de:3000'; // Setzen Sie hier Ihre API-Endpunkt-URL

  constructor(private http: HttpClient) {}

  private produktionslinienDaten!: string;
private Projektleiter!:string;
  setProduktionslinienDaten(daten: string) {
    this.produktionslinienDaten = daten;
  }

  getProduktionslinienDaten(): string {
    return this.produktionslinienDaten;
  }
  setProjektleiter(daten: string) {
    this.Projektleiter = daten;
  }

  getProjektleiter(): string {
    return this.Projektleiter;
  }
  getoreder(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orders`,this.httpOptions);
  }
}
