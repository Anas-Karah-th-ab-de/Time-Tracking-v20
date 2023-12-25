// data-sharing.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {
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
}
