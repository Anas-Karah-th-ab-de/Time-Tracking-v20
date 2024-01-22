import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { formatDate } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';


import * as XLSX from 'xlsx';
@Component({
  selector: 'app-tagesbericht',
  templateUrl: './tagesbericht.component.html',
  styleUrls: ['./tagesbericht.component.css']
})
export class TagesberichtComponent implements OnInit {
  geoeffneterIndex: number | null = null;
  produktionsDaten!: any[]; 
  datumForm: FormGroup;
  anzahlAuftraege: number = 0;
  gesamtDauerAllerAuftraege: number = 0;
  chart: Chart | null = null;
  private verarbeiteDaten(daten: any[]) {
    let gesamtDauerAllerAuftraege = 0;
  
    const auftraege = daten.map(auftrag => {
      let gesamtStueckanzahl = 0;
      let gesamtDauer = 0;
  
      auftrag.mitarbeiter.forEach((mitarbeiter: any) => {
        mitarbeiter.Produktionszeit.forEach((zeit: any) => {
          // Stellen Sie sicher, dass zeit.dauer eine Zahl ist, sonst ersetzen Sie sie durch 0
          gesamtDauer += !isNaN(zeit.dauer) ? zeit.dauer : 0;
        });
        // Stellen Sie sicher, dass mitarbeiter.stueckanzahl eine Zahl ist, sonst ersetzen Sie sie durch 0
        gesamtStueckanzahl += !isNaN(mitarbeiter.stueckanzahl) ? mitarbeiter.stueckanzahl : 0;
      });
  
      gesamtDauerAllerAuftraege += gesamtDauer;
  
      return {
        ...auftrag,
        gesamtStueckanzahl,
        gesamtDauer,
        farbe: '#' + Math.floor(Math.random()*16777215).toString(16) // Zufällige Farbe
      };
    });
  
    this.anzahlAuftraege = auftraege.length;
    this.gesamtDauerAllerAuftraege = gesamtDauerAllerAuftraege;
  
    return auftraege;
  }
  
  
  constructor(private http: HttpClient, private formBuilder: FormBuilder) {
    const heute = new Date();
    const aktuellesDatum = formatDate(heute, 'yyyy-MM-dd', 'en');

    this.datumForm = this.formBuilder.group({
      startDatum: [aktuellesDatum],
      endDatum: [aktuellesDatum],
      aktivStatus: [false]
    });
  }

  ngOnInit(): void {
    this.datenAbrufen();
    const canvas = document.getElementById('meineGrafik');
    if (canvas) {
      canvas.addEventListener('contextmenu', this.handleRightClick.bind(this));
    }
  
    this.erstelleGrafik();
  }
  handleRightClick(event: MouseEvent): void {
    event.preventDefault(); // Verhindert das Standard-Kontextmenü
    this.erstelleGrafik(); // Erstellt die Hauptgrafik neu
  }
  ngOnDestroy() {
    const canvas = document.getElementById('meineGrafik');
    if (canvas) {
      canvas.removeEventListener('contextmenu', this.handleRightClick.bind(this));
    }
  }
  
  datenAbrufen(): void {
    const startDatum = this.datumForm.value.startDatum;
    const endDatum = this.datumForm.value.endDatum;
    const aktivStatus = this.datumForm.value.aktivStatus;
    console.log('Startdatum:', startDatum);
    console.log('Enddatum:', endDatum);
    
    this.getProjekte(startDatum, endDatum, aktivStatus)
      .subscribe(data => {
        console.log(data)
        this.produktionsDaten = this.verarbeiteDaten(data);
        this.berechneGesamtDatenProAuftrag();
        this.erstelleGrafik();
        this.erstelleGesammelteDatenGrafik();
        // Verarbeiten Sie hier die empfangenen Daten
      }, error => {
        console.error('Fehler beim Abrufen der Daten:', error);
      });
  }
  aktuellerAuftrag: any = null;
  private erstelleGrafik() {
    if (this.chart) {
      this.chart.destroy();
    }
  
    this.chart = new Chart('meineGrafik', {
      type: 'bar',
      data: {
        labels: this.produktionsDaten.map(d => d.Auftrag),
        datasets: [
          {
            label: 'Gesamtdauer pro Auftrag',
            data: this.produktionsDaten.map(d => d.gesamtDauer),
            backgroundColor: 'rgba(0, 123, 255, 0.5)'
          },
          {
            label: 'Gesamtstückanzahl pro Auftrag',
            data: this.produktionsDaten.map(d => d.gesamtStueckanzahl),
            backgroundColor: 'rgba(255, 193, 7, 0.5)'
          }
        ]
      },
      options: {
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            if (this.aktuellerAuftrag) {
              // Zugriff auf den ausgewählten Mitarbeiter
              const ausgewaehlterMitarbeiter = this.aktuellerAuftrag.mitarbeiter[index];
              if (ausgewaehlterMitarbeiter) {
                // Aufruf der Funktion mit den Daten des ausgewählten Mitarbeiters
                this.zeigeMitarbeiterLeistung(ausgewaehlterMitarbeiter);
              }
              this.aktuellerAuftrag = null; // Zurücksetzen des aktuellen Auftrags
            } else {
              // Zugriff auf den ausgewählten Auftrag
              this.aktuellerAuftrag = this.produktionsDaten[index];
              this.aktualisiereGrafikMitMitarbeiterDetails(this.aktuellerAuftrag);
            }
          }
        }
      }
    });
  }
  gesamtProduktionszeit: number | null = null;
  gesamtDurchschnitt: number | null = null;
  private zeigeMitarbeiterLeistung(ausgewaehlterMitarbeiter: any) {
    if (!this.chart) {
      return;
    }
  
    const auftragsLabels = this.produktionsDaten.map(d => d.Auftrag);
    const mitarbeiterProduktionszeiten: number[] = [];
    const mitarbeiterStueckzahlen: number[] = [];
    let gesamtProduktionszeit = 0;
  
    this.produktionsDaten.forEach(auftrag => {
      const mitarbeiter = auftrag.mitarbeiter.find((m: any) => m.name === ausgewaehlterMitarbeiter.name);
      if (mitarbeiter) {
        const produktionszeit = mitarbeiter.Produktionszeit.reduce((sum: number, p: any) => sum + p.dauer, 0);
        mitarbeiterProduktionszeiten.push(produktionszeit);
        gesamtProduktionszeit += produktionszeit;
        mitarbeiterStueckzahlen.push(mitarbeiter.stueckanzahl || 0);
      } else {
        mitarbeiterProduktionszeiten.push(0);
        mitarbeiterStueckzahlen.push(0);
      }
    });
  
    const durchschnittProAuftrag = mitarbeiterProduktionszeiten.map((zeit, index) => {
      const stueckzahl = mitarbeiterStueckzahlen[index];
      return stueckzahl > 0 ? zeit / stueckzahl : 0;
    });    
    const gesamtDurchschnitt = gesamtProduktionszeit / mitarbeiterProduktionszeiten.length;

    this.chart.data.labels = auftragsLabels;
    this.chart.data.datasets = [
      {
        label: 'Produktionszeit für ' + ausgewaehlterMitarbeiter.name,
        data: mitarbeiterProduktionszeiten,
        backgroundColor: 'rgba(75, 192, 132, 0.5)' // Grün
      },

      {
        label: 'Stückzahl für ' + ausgewaehlterMitarbeiter.name,
        data: mitarbeiterStueckzahlen,
        backgroundColor: 'rgba(153, 102, 255, 0.5)' // Purpur
      },
      {
        label: 'Durchschnittliche Produktionszeit pro Stück pro Auftrag (min/Stück)',
        data: durchschnittProAuftrag,
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      }
      
      
    ];
    
  
    this.chart.update();
    this.gesamtProduktionszeit = gesamtProduktionszeit;
    this.gesamtDurchschnitt = gesamtDurchschnitt;
    console.log(`Gesamtproduktionszeit: ${gesamtProduktionszeit}`);

  console.log(`Gesamtdurchschnitt der Produktionszeit: ${gesamtDurchschnitt}`);
  
  }
  
  
  private aktualisiereGrafikMitMitarbeiterDetails(auftrag: any) {
    if (!this.chart) {
      return; // Verhindert den weiteren Ablauf, falls chart noch nicht initialisiert wurde
    }
  
    const mitarbeiterLabels = auftrag.mitarbeiter.map((m: any) => m.name);
    const mitarbeiterZeiten = auftrag.mitarbeiter.map((m: any) => m.gesamtDauer);
    const mitarbeiterStueckzahlen = auftrag.mitarbeiter.map((m: any) => m.stueckanzahl);
    const produktionszeiten = auftrag.mitarbeiter.map((m: any) =>
    m.Produktionszeit.reduce((sum: number, p: any) => sum + p.dauer, 0)
  );
  const ruestzeiten = auftrag.mitarbeiter.map((m: any) =>
    m.Ruestzeit ? m.Ruestzeit.reduce((sum: number, r: any) => sum + r.dauer, 0) : 0
  );
  const wartezeiten = auftrag.mitarbeiter.map((m: any) =>
    m.Wartezeit ? m.Wartezeit.reduce((sum: number, w: any) => sum + w.dauer, 0) : 0
  );
  
    this.chart.data.labels = mitarbeiterLabels;
     this.chart.data.datasets = [
      {
        label: 'Produktionszeit pro Mitarbeiter',
        data: produktionszeiten,
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      },
      {
        label: 'Rüstzeit pro Mitarbeiter',
        data: ruestzeiten,
        backgroundColor: 'rgba(255, 99, 132, 0.5)'
      },
      {
        label: 'Wartezeit pro Mitarbeiter',
        data: wartezeiten,
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      },
      {
        label: 'Stückzahl pro Mitarbeiter',
        data: mitarbeiterStueckzahlen,
        backgroundColor: 'rgba(255, 206, 86, 0.5)'
      }
    ];
    
    this.chart.update();
  }
  

  
  private apiUrl = 'http://kmapp.prestigepromotion.de:3002';
  getProjekte(startDatum: string, endDatum: string, aktivStatus: boolean): Observable<any> {

    return this.http.get<any>(`${this.apiUrl}/projekt/bricht`, {
      params: { startDatum, endDatum, aktivStatus: aktivStatus.toString() }
    });
  }

  gesammelteDatenChart: Chart | null = null;
  gesamtDatenProAuftrag: { [auftragsnummer: string]: { gesamtDauer: number, gesamtStueckzahl: number } } = {};


  private berechneGesamtDatenProAuftrag() {
    this.gesamtDatenProAuftrag = this.produktionsDaten.reduce((akkumulator, auftrag) => {
      if (akkumulator[auftrag.Auftrag]) {
        akkumulator[auftrag.Auftrag].gesamtDauer += auftrag.gesamtDauer;
        akkumulator[auftrag.Auftrag].gesamtStueckzahl += auftrag.gesamtStueckanzahl;
      } else {
        akkumulator[auftrag.Auftrag] = {
          gesamtDauer: auftrag.gesamtDauer,
          gesamtStueckzahl: auftrag.gesamtStueckanzahl
        };
      }
      return akkumulator;
    }, {});
  }

  private erstelleGesammelteDatenGrafik() {
    if (this.gesammelteDatenChart) {
      this.gesammelteDatenChart.destroy();
    }
  
    const labels = Object.keys(this.gesamtDatenProAuftrag);
    const gesamtDauerDaten = labels.map(label => this.gesamtDatenProAuftrag[label].gesamtDauer);
    const gesamtStueckzahlDaten = labels.map(label => this.gesamtDatenProAuftrag[label].gesamtStueckzahl);
  
    this.gesammelteDatenChart = new Chart('gesammelteDatenGrafik', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Gesamtdauer pro Auftragsnummer',
            data: gesamtDauerDaten,
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
          },
          {
            label: 'Gesamtstückzahl pro Auftragsnummer',
            data: gesamtStueckzahlDaten,
            backgroundColor: 'rgba(255, 99, 132, 0.5)'
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  downloadAsPDF() {
    const element = document.querySelector(".tabelle-und-grafik") as HTMLElement; // Typumwandlung zu HTMLElement

    // Überprüfen Sie, ob das Element existiert
    if (element) {
      html2canvas(element).then(canvas => {
     const imgData = canvas.toDataURL('image/png');
     const pdf = new jsPDF({
       orientation: "landscape",
       unit: "px",
       format: [canvas.width, canvas.height]
     });
     pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
     const startDate = this.datumForm.value.startDatum;
     const endDate = this.datumForm.value.endDatum;
     const pdfName = `Bericht_von_${startDate}_bis_${endDate}.pdf`;
     pdf.save(pdfName);
   });
 } else {
   console.error('Das Element zum Erstellen des PDFs wurde nicht gefunden.');
 }
}
    

  // Methode zum Herunterladen der Daten als Excel
  downloadAsExcel() {
    // Bereiten Sie die Daten vor, die in die Excel-Tabelle geschrieben werden sollen
    // Wenn Sie die Datenstruktur ändern möchten, passen Sie sie hier an
    const dataForExcel = this.produktionsDaten.map(auftrag => {
      return {
        Auftragsnummer: auftrag.Auftrag,
        Startdatum: auftrag.startzeit,
        Stückanzahl: auftrag.gesamtStueckanzahl,
        Dauer: `${auftrag.gesamtDauer} Min`,
        Gesamtstückanzahl: this.gesamtDatenProAuftrag[auftrag.Auftrag]?.gesamtStueckzahl || auftrag.gesamtStueckanzahl,
        Gesamtdauer: `${this.gesamtDatenProAuftrag[auftrag.Auftrag]?.gesamtDauer || auftrag.gesamtDauer} Min`
      };
    });
  
    // Konvertieren Sie das vorbereitete Datenobjekt in ein Arbeitsblatt
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
  
    // Hier berechnen Sie den Dateinamen basierend auf dem Datum des Formulars
    const startDate = this.datumForm.value.startDatum;
    const endDate = this.datumForm.value.endDatum;
    const excelFileName = `Bericht_von_${startDate}_bis_${endDate}.xlsx`;
  
    // Schreiben der Excel-Datei
    XLSX.writeFile(workbook, excelFileName);
  }
  
/*
  datenZusammengefasst: boolean = false;
  ansichtButtonLabel: string = 'Zusammenfassen';  // Text für den Button

  // Methode zum Umschalten der Ansicht
  toggleAnsicht(): void {
    this.datenZusammengefasst = !this.datenZusammengefasst;
    this.ansichtButtonLabel = this.datenZusammengefasst ? 'Details' : 'Zusammenfassen';
    // Aktualisieren Sie die Klasse für den Button, um die Farbe zu ändern
    // Rufen Sie hier die Methode auf, die Ihre Daten entsprechend verarbeitet
    this.verarbeiteDatenZurAnsicht();
  }

  verarbeiteDatenZurAnsicht(): void {
    if (this.datenZusammengefasst) {
      // Implementieren Sie die Logik zum Zusammenfassen Ihrer Daten
    } else {
      // Implementieren Sie die Logik zum Anzeigen der Einzelaufträge
    }
    // Vergessen Sie nicht, die Ansicht zu aktualisieren, z.B. durch Aufrufen von this.chart.update();
  }
*/
}
