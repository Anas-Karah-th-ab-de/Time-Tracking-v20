// data-sharing.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {
  private produktionslinienDaten!: string;

  setProduktionslinienDaten(daten: string) {
    this.produktionslinienDaten = daten;
  }

  getProduktionslinienDaten(): string {
    return this.produktionslinienDaten;
  }
}
