import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-navi',
  templateUrl: './navi.component.html',
  styleUrl: './navi.component.css'
})
export class NaviComponent {
  constructor(
    private httpClient : HttpClient,
    private dialog: MatDialog,
   
  
    private router: Router
  ) {}
  ngOnInit() {
    if (this.sidenav) {
      this.sidenav.close();
    }
  }
  

logout() {

}
@ViewChild('sidenav') sidenav?: MatSidenav;
toggleSidenav() {
  if (this.sidenav) {
      this.sidenav.toggle();
  }
}
}
