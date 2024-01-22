import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-grafik',
  templateUrl: './grafik.component.html',
  styleUrls: ['./grafik.component.css']
})
export class GrafikComponent implements OnInit {
  @ViewChild('chart') chartElement!: ElementRef;
  @Input() data!: any[]; // Daten, die für die Grafik verwendet werden

  chart!: Chart;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.createChart();
  }

  createChart() {
    if (this.chart) {
      this.chart.destroy(); // Zerstören Sie die alte Grafik, falls vorhanden
    }

    this.chart = new Chart(this.chartElement.nativeElement, {
      type: 'bar', // oder 'line', 'pie', etc.
      data: {
        labels: this.data.map(d => d.label),
        datasets: [{
          label: 'Beispiel-Dataset',
          data: this.data.map(d => d.value),
          backgroundColor: 'rgba(0, 123, 255, 0.5)'
        }]
      },
      options: {
        // Konfigurationsoptionen
      }
    });
  }
}
