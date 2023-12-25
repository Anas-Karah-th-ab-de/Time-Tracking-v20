export interface Mitarbeiter {
  _id: string; // Hinzugefügt
  name: string;
  projektleiter: boolean;
  MitarbeiterNummer: string;
  stueckanzahl:number;
  // andere Felder
}
export interface Mitarbeiterku {
  _id: string;
  name: string;

  stueckanzahl:number;
 // anmeldezeit: string | { $date: string };
  abmeldezeit?: string | { $date: string };
  // andere Felder
}