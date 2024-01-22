
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { BehaviorSubject } from 'rxjs';
import { Mitarbeiter } from '../model/mitarbeiter.model';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // oder 'MitarbeiterService' wird in einem spezifischen Modul bereitgestellt
})
export class MitarbeiterService {
  private apiUrl = 'http://-:3001/mitarbeiter';

  constructor(private http: HttpClient) { }

  getMitarbeiter(): Observable<Mitarbeiter[]> {
    return this.http.get<Mitarbeiter[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  addMitarbeiter(mitarbeiterData: any): Observable<any> {
    return this.http.post<Mitarbeiter>(this.apiUrl, mitarbeiterData).pipe(
      catchError(this.handleError)
    );
  }
  deleteMitarbeiter(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  updateMitarbeiter(id: string, mitarbeiterData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, mitarbeiterData);
  }
  getMitarbeiterById(id: string): Observable<Mitarbeiter> {
    return this.http.get<Mitarbeiter>(`${this.apiUrl}/${id}`);
  }
  private bearbeitenderMitarbeiterSource = new BehaviorSubject<Mitarbeiter | null>(null);

setBearbeitenderMitarbeiter(mitarbeiter: Mitarbeiter) {
  this.bearbeitenderMitarbeiterSource.next(mitarbeiter);
}

getBearbeitenderMitarbeiter(): Observable<Mitarbeiter | null> {
  return this.bearbeitenderMitarbeiterSource.asObservable();
}

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('Ein Fehler ist aufgetreten:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError(() => new Error('Etwas Schlimmes ist passiert; bitte versuchen Sie es später noch einmal.'));
  }
}
