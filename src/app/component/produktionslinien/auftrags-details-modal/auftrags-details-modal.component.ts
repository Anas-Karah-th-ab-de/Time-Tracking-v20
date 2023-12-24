import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-auftrags-details-modal',
  templateUrl: './auftrags-details-modal.component.html',
  styleUrls: ['./auftrags-details-modal.component.css']
})
export class AuftragsDetailsModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
