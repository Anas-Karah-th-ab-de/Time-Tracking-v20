import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-bricht',
  templateUrl: './bricht.component.html',
  styleUrl: './bricht.component.css'
})
export class BrichtComponent  implements OnInit {
  produktionsDaten: any;
  auftragsDaten: any;

  ngOnInit(): void {
    // Beispiel-Daten, die Sie normalerweise von einem Service holen würden
    this.produktionsDaten = {
      "_id": {"$oid": "659bbac44e5f19d990187bc8"},
      "Auftrag": "Pr.220288037",
      // ...weitere Daten...
      "mitarbeiter": [
        // ...Mitarbeiterdaten...
      ],
      // ...weitere Daten...
    };

    this.auftragsDaten = {
      "_id": {"$oid": "6530e17cbf538000c4151d3c"},
      "auftragsnr": "220288037",
      // ...weitere Daten...
    };
  }


  selectedBerichtTyp: string = 'tagesbericht'; // Standardberichtstyp

  constructor() {
    // Konstruktor-Logik hier, falls benötigt
  }

  onBerichtTypChange(): void {
    // Logik, die ausgeführt wird, wenn der Berichtstyp geändert wird
    console.log('Berichtstyp geändert:', this.selectedBerichtTyp);
    // Sie können hier zusätzliche Datenabruf- oder Update-Operationen durchführen
  }

  downloadBericht(): void {
    // Logik zum Herunterladen des Berichts
    console.log('Bericht herunterladen:', this.selectedBerichtTyp);
    // Implementieren Sie die spezifische Logik zum Herunterladen des Berichts
    // Dies kann das Erstellen einer Datei im gewünschten Format und das Auslösen eines Downloads beinhalten
  }

  // Weitere Methoden und Logik für die Komponente können hier hinzugefügt werden

}