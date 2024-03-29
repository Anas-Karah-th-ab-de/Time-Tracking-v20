import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DataSharingService } from '../../service/data-sharing.service';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  readonly httpOptions = {
    headers: new HttpHeaders({
      'PrestigePromotion': 'MA-Ak-KM-Idlib-+963-023'
    })
  };
  userInput!: string;
  userInputSubject = new Subject<string>();

  constructor(private router: Router,private http: HttpClient,private dataSharingService: DataSharingService) {
    // Debounce user input
    this.userInputSubject.pipe(
      debounceTime(1000)  // Warten Sie 1 Sekunde nach der letzten Eingabe
    ).subscribe(value => {
      this.login();
    });
  }

  onUserInputChanged(value: string) {
    this.userInput = value;
    this.userInputSubject.next(value);
  }

  login() {
    this.http.post<LoginResponse>('http://kmapp.prestigepromotion.de:3002/login', { username: this.userInput },this.httpOptions)
      .subscribe(response => {
        console.log(response);
        // Überprüfen Sie, ob das user-Objekt vorhanden ist
        if (response.user) {
          this.redirectUser(response.user.username);
        }
      });
  }
  
  redirectUser(username: string) {
    if (username.startsWith('PL.')) {
      this.dataSharingService.setProduktionslinienDaten(username);

      // Extrahieren Sie den Teil nach 'PL.' und navigieren Sie zu dieser Route
      const produktionslinie = username.split('PL.')[1];
      this.router.navigate(['/Einbuchen', produktionslinie]);
      this.userInput = '';
    } else if (username.includes('Projektleiter: ja')) {
      const qrCodeTeile = username.split(', ');
  
      // Erwarten des Formats "Name: [Name]" für den ersten Teil
      const nameTeil = qrCodeTeile[0].split(': ');
      const mitarbeiterName = nameTeil[1].trim();
      this.dataSharingService.setProjektleiter(mitarbeiterName);
      // Weiterleitung zur Projektleiter-Seite
      this.router.navigate(['/fertige-Stundenzettel',mitarbeiterName]);
      this.userInput = '';
    } else {
      // Weiterleitung zu einer Standardseite oder einer Fehlerseite
      this.router.navigate(['/fertige-Stundenzettel']);
      this.userInput = '';
    }
  }
  
}
interface LoginResponse {
  message: string;
  user?: { username: string };
}
