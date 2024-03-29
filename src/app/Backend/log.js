const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();
const Projekt = require('./model/Projekt');
const User  = require('./model/user');

app.use(cors({
    origin: function (origin, callback) {
      const allowedOrigins = ['http://kmapp.prestigepromotion.de:83', 'http://localhost:4200', 'http://kmapp.prestigepromotion.de','*'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS policy'));
      }
    }
  }));
app.use(bodyParser.json());


mongoose.connect('mongodb:/-/time-tracking')
  .then(() => console.log('MongoDB verbunden...'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));
  const auftragDbConnection = mongoose.createConnection('mongodb://kmapp.prestigepromotion.de:27017/auftragDB', );
  const timeTrackingDbConnection = mongoose.createConnection('mongodb://kmapp.prestigepromotion.de:27017/time-tracking', );
  app.post('/login', async (req, res) => {
    try {
        const { username } = req.body;
        //console.log(username)
        const user = await User.findOne({ username });

        if (user) {
            res.status(200).json({ message: "Login erfolgreich", user });
        } else {
            res.status(404).json({ message: "Benutzer nicht gefunden" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Serverfehler" });
    }
});


app.post('/data', async (req, res) => {
  try {
    const { typ, inputValue, produktionslinie } = req.body;
    const today = new Date();
    const isSaturday = today.getDay() === 6; // 6 is Saturday in getDay()
//console.log(req.body)
    if (typ === 'Mitarbeiter') {
      const status= req.body.status;
      const status1='';
      if (status=='Produktionszeit'){status1==''}
      const name = inputValue.split(',')[0].split(':')[1].trim();
      await abmeldeMitarbeiterVonAllenProjekten(name);

      let projekt = await Projekt.findOne({ produktionslinie, aktiv: true });

      if (!projekt) {
        projekt = new Projekt({
          produktionslinie,
          startzeit: new Date(),
          aktiv: true,
          arbeitsschicht: isSaturday ? 'Samstagschicht' : '', // Set the arbeitsschicht based on the day
          mitarbeiter: [] // Initialisieren als leeres Array
        });
      }
    
      // Stellen Sie sicher, dass das mitarbeiter-Array existiert
      else if (!projekt.mitarbeiter) {
        projekt.mitarbeiter = []; // Initialisieren, falls das Array nicht existiert
      }
      const mitarbeiterExistiert = projekt.mitarbeiter.some(m => m.name === name);
      if (!mitarbeiterExistiert) {
        const neuerMitarbeiter = {
          _id: new mongoose.Types.ObjectId(),
          name,
          anmeldezeit: new Date(),
          Produktionszeit: [],
          Ruestzeit: [],
          Wartezeit: []
        };

        // Fügen Sie den Mitarbeiter dem entsprechenden Zeitintervall hinzu
        neuerMitarbeiter[status].push({ nummer: 1, start: new Date(),ende:null });

        projekt.mitarbeiter.push(neuerMitarbeiter);
        await projekt.save();
        res.status(200).json({ message: 'Mitarbeiter erfolgreich hinzugefügt', projektId: projekt._id });
      } else {
        res.status(200).json({ message: 'Mitarbeiter ist bereits im Projekt', projektId: projekt._id });
      }
    
    

    } else if (typ === 'Auftrag') {

        // Überprüfen, ob ein aktives Projekt für die Produktionslinie existiert
        let aktuellesProjekt = await Projekt.findOne({ produktionslinie: produktionslinie, aktiv: true });
  
        if (!aktuellesProjekt || !aktuellesProjekt.Auftrag) {
          // Fall 1: Kein aktuelles Projekt oder kein Auftrag vorhanden, daher wird der Auftrag ergänzt oder ein neues Projekt erstellt
          if (aktuellesProjekt) {
            aktuellesProjekt.Auftrag = inputValue;
            await aktuellesProjekt.save();
            res.status(200).json({ message: "Auftrag zum Projekt hinzugefügt", id: aktuellesProjekt._id });
          } else {
            const neuesProjekt = new Projekt({
              Auftrag: inputValue,
              produktionslinie: produktionslinie,
              startzeit: new Date(),
              aktiv: true
            });
            await neuesProjekt.save();
            res.status(200).json({ message: "Neues Projekt erstellt", id: neuesProjekt._id });
          }
        } else {
          // Fall 2: Ein aktives Projekt mit Auftrag existiert bereits
          // Für alle Mitarbeiter den Abmeldezeit eintragen
          aktuellesProjekt.mitarbeiter.forEach(mitarbeiter => {
            mitarbeiter.abmeldezeit = new Date();
          });
          aktuellesProjekt.endzeit = new Date();
          aktuellesProjekt.aktiv = false;
          await aktuellesProjekt.save();
  
          // Erstellen eines neuen Projekts
          const neuesProjekt = new Projekt({
            Auftrag: inputValue,
            produktionslinie: produktionslinie,
            startzeit: new Date(),
            aktiv: true
          });
          await neuesProjekt.save();
          res.status(200).json({ message: "Neues Projekt erstellt und altes Projekt abgeschlossen", id: neuesProjekt._id });
        }
      }
      // Hier können weitere 'else if'-Anweisungen für andere 'typ'-Werte hinzugefügt werden
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Fehler beim Verarbeiten der Anfrage" });
    }
  });
  const AuftragSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    pos: Number,
    auftragsnr: String,
    fpartnr: [String],
    fpartnr_extern: String,
    kunde: String,
    wacharge: String,
    fpbezeichnung: String,
    sollmenge: Number,
   

});

const Auftrag = auftragDbConnection.model('Auftrag', AuftragSchema);
app.get('/check-aktiver-auftrag', async (req, res) => {
  try {
    const produktionslinie = req.query.produktionslinie;
    const auftragsnummer = req.query.Auftrag.replace('Pr.', '').trim();

    if (!produktionslinie) {
      return res.status(400).send('Produktionslinie ist erforderlich');
    }

    // Überprüfen, ob es ein aktives Projekt in der Produktionslinie gibt
    const aktivesProjekt = await Projekt.findOne({ produktionslinie, aktiv: true });

    if (aktivesProjekt && aktivesProjekt.Auftrag) {
      // Ein aktives Projekt existiert und hat einen Eintrag im Feld "Auftrag"
      const auftragsDetails = await Auftrag.findOne({ auftragsnr: auftragsnummer });
      res.json({
        existiertAktiverAuftrag: true,
        auftragsDetails: {
          auftragsnr: auftragsDetails.auftragsnr,
          fpbezeichnung: auftragsDetails.fpbezeichnung,
          sollmenge: auftragsDetails.sollmenge
        }
      });
    } else {
      // Kein aktives Projekt oder kein Eintrag im Feld "Auftrag"
      res.json({ existiertAktiverAuftrag: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Serverfehler');
  }
});


  app.get('/auftrag-details/:auftragsnummer', async (req, res) => {
    try {
      let auftragsnummer = req.params.auftragsnummer;
      auftragsnummer = auftragsnummer.replace('Pr.', '').trim();
      
      const auftragsNummerInt = parseInt(auftragsnummer, 10);
  
      const auftragsDetails = await Auftrag.findOne({ auftragsnr: auftragsnummer });
  
      if (auftragsDetails) {
        const response = {
          existiertAktiverAuftrag: true,
          auftragsDetails: {
            auftragsnr: auftragsDetails.auftragsnr,
            fpbezeichnung: auftragsDetails.fpbezeichnung,
            sollmenge: auftragsDetails.sollmenge
          }
        };
       // console.log(response);
        res.json(response);
      } else {
        res.status(404).send('Auftragsdetails nicht gefunden');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Serverfehler');
    }
  });
  app.get('/aktives-projekt/:produktionslinie', async (req, res) => {
    try {
        const produktionslinie = req.params.produktionslinie;
        const aktivesProjekt = await Projekt.findOne({
            produktionslinie: produktionslinie,
            aktiv: true
        });

        if (!aktivesProjekt) {
            return res.status(404).send('Kein aktives Projekt gefunden.');
        }
    //console.log(aktivesProjekt)
        res.json(aktivesProjekt);
    } catch (err) {
        console.error(err);
        res.status(500).send('Serverfehler');
    }
});


app.put('/aktualisiereStatus/:produktionslinie', async (req, res) => {
  try {
    const produktionslinie = req.params.produktionslinie;
    const { mitarbeiterName, neueAktivitaet } = req.body;

    if (!produktionslinie || !mitarbeiterName || !neueAktivitaet) {
      return res.status(400).send({ message: 'Produktionslinie, Mitarbeitername und neue Aktivität sind erforderlich' });
    }

    const projekt = await Projekt.findOne({ produktionslinie, aktiv: true });

    if (!projekt) {
      return res.status(404).send({ message: 'Projekt nicht gefunden' });
    }

    const mitarbeiter = projekt.mitarbeiter.find(m => m.name === mitarbeiterName);

    if (!mitarbeiter) {
      return res.status(400).send({ message: 'Mitarbeiter nicht gefunden' });
    }

    // Überprüfen aller Aktivitäten auf offene Einträge
    const hatOffeneEinträge = ['Produktionszeit', 'Ruestzeit', 'Wartezeit'].some(aktivitaet => 
      Array.isArray(mitarbeiter[aktivitaet]) && mitarbeiter[aktivitaet].some(s => s.ende === null)
    );

    if (hatOffeneEinträge) {
      // Aktualisieren des Status, wenn ein offener Eintrag vorhanden ist
      await wechselAktivitaet(produktionslinie, mitarbeiterName, neueAktivitaet);
      res.status(200).send({ message: 'Mitarbeiterstatus erfolgreich aktualisiert' });
    } else {
      res.status(200).send({ message: 'Keine offenen Einträge vorhanden, keine Aktualisierung durchgeführt' });
    }

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Mitarbeiterstatus:', error);
    res.status(500).send({ message: 'Interner Serverfehler' });
  }
});


const abmeldeMitarbeiterVonAllenProjekten = async (mitarbeiterName) => {
  try {
    // Suche in allen aktiven Projekten
    const aktiveProjekte = await Projekt.find({ aktiv: true });

    for (let projekt of aktiveProjekte) {
      const mitarbeiterIndex = projekt.mitarbeiter.findIndex(m => m.name === mitarbeiterName);
      if (mitarbeiterIndex !== -1) {
        const mitarbeiter = projekt.mitarbeiter[mitarbeiterIndex];
        const aktuellesDatum = new Date();

        ['Produktionszeit', 'Ruestzeit', 'Wartezeit'].forEach(aktivitaet => {
          if (mitarbeiter[aktivitaet] && mitarbeiter[aktivitaet].length > 0) {
            let offenesIntervall = mitarbeiter[aktivitaet].find(intervall => !intervall.ende);
            if (offenesIntervall) {
              offenesIntervall.ende = aktuellesDatum;
              offenesIntervall.dauer = Math.round((aktuellesDatum.getTime() - new Date(offenesIntervall.start).getTime()) / 60000);            }
          }
        });

        try {
          await projekt.save();
          if (sindAlleMitarbeiterAbgemeldet(projekt)) {
            projekt.aktiv = false;
            projekt.endzeit = new Date();
            await projekt.save();
          }
        } catch (error) {
          if (error instanceof mongoose.Error.VersionError) {
            // Projekt neu laden und erneut versuchen
            const frischesProjekt = await Projekt.findById(projekt._id);
            if (!frischesProjekt) {
              console.log('Projekt nicht mehr vorhanden');
              continue; // Zum nächsten Projekt gehen
            }
            // Änderungen erneut anwenden
            // ...
            await frischesProjekt.save();
          } else {
            throw error;
          }
        }
      }
    }
  } catch (error) {
    throw error;
  }
};


const abmeldeMitarbeiterVonAllenProjektenohneende = async (mitarbeiterName) => {
  try {
    // Suche in allen aktiven Projekten
    const aktiveProjekte = await Projekt.find({ aktiv: true });

    for (let projekt of aktiveProjekte) {
      const mitarbeiterIndex = projekt.mitarbeiter.findIndex(m => m.name === mitarbeiterName);
      if (mitarbeiterIndex !== -1) {
        const mitarbeiter = projekt.mitarbeiter[mitarbeiterIndex];
        const aktuellesDatum = new Date();

        ['Produktionszeit', 'Ruestzeit', 'Wartezeit'].forEach(aktivitaet => {
          if (mitarbeiter[aktivitaet] && mitarbeiter[aktivitaet].length > 0) {
            let offenesIntervall = mitarbeiter[aktivitaet].find(intervall => !intervall.ende);
            if (offenesIntervall) {
              offenesIntervall.ende = aktuellesDatum;
              offenesIntervall.dauer = Math.round((aktuellesDatum.getTime() - new Date(offenesIntervall.start).getTime()) / 60000);            }
          }
        });

        try {
          await projekt.save();
        
        } catch (error) {
          if (error instanceof mongoose.Error.VersionError) {
            // Projekt neu laden und erneut versuchen
            const frischesProjekt = await Projekt.findById(projekt._id);
            if (!frischesProjekt) {
              console.log('Projekt nicht mehr vorhanden');
              continue; // Zum nächsten Projekt gehen
            }
            // Änderungen erneut anwenden
            // ...
            await frischesProjekt.save();
          } else {
            throw error;
          }
        }
      }
    }
  } catch (error) {
    throw error;
  }
};
const sindAlleMitarbeiterAbgemeldet = (projekt) => {
  for (let mitarbeiter of projekt.mitarbeiter) {
    if (mitarbeiter.Produktionszeit.some(zeitIntervall => !zeitIntervall.ende) ||
        mitarbeiter.Ruestzeit.some(zeitIntervall => !zeitIntervall.ende) ||
        mitarbeiter.Wartezeit.some(zeitIntervall => !zeitIntervall.ende)) {
      return false;
    }
  }
  return true;
};
app.post('/api/abmeldung', async (req, res) => {
  try {
    // Nehmen wir an, der QR-Code enthält direkt den Namen des Mitarbeiters
    const mitarbeiterName = req.body.mitarbeiterName; // Oder extrahieren Sie den Namen anders aus dem QR-Code
//console.log(mitarbeiterName);
//console.log(req.body);
    await abmeldeMitarbeiterVonAllenProjekten(mitarbeiterName);

    // Antwort senden
    res.status(200).json({
      mitarbeiterName: mitarbeiterName,
      abmeldezeit: new Date() // Die aktuelle Zeit als Abmeldezeit
    });
  } catch (error) {
    console.error('Fehler bei der Abmeldung:', error);
    res.status(500).send('Interner Serverfehler');
  }
});
async function wechselAktivitaet(produktionslinie, mitarbeiterName, neueAktivitaet) {
  //console.log(mitarbeiterName,neueAktivitaet)
  try {
    let projekt = await Projekt.findOne({ produktionslinie: produktionslinie, aktiv: true });
    if (!projekt) {
      console.log(' wProjekt nicht gefunden');
      return;
    }
    const mitarbeiter = projekt.mitarbeiter.find(m => m.name === mitarbeiterName);
    if (!mitarbeiter) {
      console.log('Mitarbeiter nicht gefunden');
      return;
    }
    await abmeldeMitarbeiterVonAllenProjektenohneende( mitarbeiterName);
    const jetzt = new Date();
    let neuesIntervall = {
      nummer: (mitarbeiter[neueAktivitaet]?.length || 0) + 1,
      start: jetzt,
      ende: null
    };
    mitarbeiter[neueAktivitaet] = mitarbeiter[neueAktivitaet] || [];
    mitarbeiter[neueAktivitaet].push(neuesIntervall);
    mitarbeiter.letzteAktivitaet = neueAktivitaet;

    try {
      await projekt.save();
    } catch (error) {
      if (error instanceof mongoose.Error.VersionError) {
        // Projekt neu laden und erneut versuchen
        projekt = await Projekt.findOne({ produktionslinie: produktionslinie, aktiv: true });
        if (!projekt) {
          console.log('bProjekt nicht gefunden');
          return;
        }
    
        const mitarbeiter = projekt.mitarbeiter.find(m => m.name === mitarbeiterName);
        if (!mitarbeiter) {
          console.log('Mitarbeiter nicht gefunden');
          return;
        }
    
        await abmeldeMitarbeiterVonAllenProjekten( mitarbeiterName);
    
        const jetzt = new Date();
        let neuesIntervall = {
          nummer: (mitarbeiter[neueAktivitaet]?.length || 0) + 1,
          start: jetzt,
          ende: null
        };
        mitarbeiter[neueAktivitaet] = mitarbeiter[neueAktivitaet] || [];
        mitarbeiter[neueAktivitaet].push(neuesIntervall);
        mitarbeiter.letzteAktivitaet = neueAktivitaet;
        // ...
        await projekt.save();
      } else {
        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
}

app.post('/checkMitarbeiter/:produktionslinie', async (req, res) => {
  const produktionslinie = req.params.produktionslinie;
  const { mitarbeiterName, status } = req.body;

  try {
      const projekt = await Projekt.findOne({ produktionslinie: produktionslinie, aktiv: true });

      if (!projekt) {
          return res.status(404).send('Projekt nicht gefunden');
      }

      let mitarbeiter = projekt.mitarbeiter.find(m => m.name === mitarbeiterName);
  

      // Überprüfen, ob ein Eintrag ohne Ende vorhanden ist
      const hatOffeneEinträge = mitarbeiter[status] && mitarbeiter[status].some(s => s.ende === null);

      if (hatOffeneEinträge) {
        res.json({ message: 'Keine Änderung durchgeführt' });
      } else {
        await abmeldeMitarbeiterVonAllenProjekten(mitarbeiter.name);
        console.log('sssssssss',mitarbeiter.name)
          // Fügen Sie den neuen Eintrag zum entsprechenden Status hinzu
          const höchsteNummer = mitarbeiter[status].reduce((max, eintrag) => eintrag.nummer > max ? eintrag.nummer : max, 0);
          const neueNummer = höchsteNummer + 1;
      
          // Fügen Sie den neuen Eintrag mit der berechneten Nummer hinzu
          mitarbeiter[status].push({ nummer: neueNummer, start: new Date(), ende: null });
     
          
          //console.log(mitarbeiter)
          await projekt.save();
          res.json({ message: 'Mitarbeiter erneuet angemeldet' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).send('Interner Serverfehler');
  }
});

//Projekt leiter
app.get('/projekte/nichtAktiv', async (req, res) => {
  try {
    // Finden Sie Projekte, die nicht aktiv sind und keine Palettendaten haben
    const Projekts = await Projekt.find({ 
      aktiv: false, 
      bilanzierungBestaetigt: false // $exists: false prüft, ob das Feld nicht existiert
    });

    if (Projekts.length === 0) {
      return res.status(404).send('Kein Projekt gefunden.');
    }

    res.json(Projekts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Serverfehler');
  }
});

app.get('/projekte/nichtAktiv/alt', async (req, res) => {
  try {
    // Finden Sie Projekte, die nicht aktiv sind und keine Palettendaten haben
    const Projekts = await Projekt.find({ 
      aktiv: false, 
    // $exists: false prüft, ob das Feld nicht existiert
    });

    if (Projekts.length === 0) {
      return res.status(404).send('Kein Projekt gefunden.');
    }

    res.json(Projekts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Serverfehler');
  }
});





app.post('/neuerAuftragMitarbeiter/:produktionslinie', async (req, res) => {
  try {
    const produktionslinie = req.params.produktionslinie;
    const { Auftrag } = req.body; // Statt req.body.Auftrag

    let aktuellesProjekt = await Projekt.findOne({ produktionslinie, aktiv: true });

    if (!aktuellesProjekt) {
      return res.status(400).send({ message: 'Kein aktives Projekt gefunden' });
    }

    // Filtern der Mitarbeiter mit offenen Zeiten
    const mitarbeiterMitOffenenZeiten = aktuellesProjekt.mitarbeiter.filter(mitarbeiter =>
      ['Produktionszeit', 'Ruestzeit', 'Wartezeit'].some(aktivitaet =>
        Array.isArray(mitarbeiter[aktivitaet]) && mitarbeiter[aktivitaet].some(s => s.ende === null)
      )
    );

    if (mitarbeiterMitOffenenZeiten.length === 0) {
      return res.status(400).send({ message: 'Keine Mitarbeiter mit offenen Zeiten gefunden' });
    }
    const kopierteMitarbeiter = mitarbeiterMitOffenenZeiten.map(mitarbeiter => {

      
      return {
        _id: new mongoose.Types.ObjectId(), // Erstellt eine neue ID für jeden Mitarbeiter
        name: mitarbeiter.name,
        Produktionszeit: [{ nummer: 1, start: new Date(), ende: null }],
        Ruestzeit: [],
        Wartezeit: [] // Weitere relevante Eigenschaften können hier übernommen werden, außer Zeitdatensätzen
      };
    });
        // Schließen aller offenen Zeiten dieser Mitarbeiter
    mitarbeiterMitOffenenZeiten.forEach(mitarbeiter => {
      ['Produktionszeit', 'Ruestzeit', 'Wartezeit'].forEach(aktivitaet => {
        mitarbeiter[aktivitaet].forEach(s => {
          if (s.ende === null) {
            s.ende = new Date();
          }
        });
      });
    });

    // Erstellen eines neuen Projekts mit diesen Mitarbeitern und dem neuen Auftrag
    const neuesProjekt = new Projekt({
      produktionslinie,
      Auftrag: Auftrag,
      startzeit: new Date(),
      aktiv: true,
      mitarbeiter: kopierteMitarbeiter
    });

    // Speichern des neuen Projekts
    await neuesProjekt.save();

    // Deaktivieren des aktuellen Projekts
    aktuellesProjekt.aktiv = false;
    aktuellesProjekt.endzeit = new Date();
    await aktuellesProjekt.save();

    res.status(200).json({ message: 'Neues Projekt erstellt mit Mitarbeitern mit geschlossenen Zeiten', neuesProjekt });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Fehler beim Verarbeiten der Anfrage' });
  }
});

//bearbeiten
/*app.get('/api/vorletztes-nicht-aktives-projekt', async (req, res) => {
  try {
    const { produktionslinie, auftrag } = req.query;

    // Finden Sie alle nicht aktiven Projekte, die den Kriterien entsprechen
    const projekte = await Projekt.find({
      produktionslinie: produktionslinie,
      Auftrag: auftrag,
      aktiv: false
    }).sort({ startzeit: -1 }); // Sortieren nach Startzeit in absteigender Reihenfolge

    if (projekte.length < 2) {
      return res.status(404).send('Nicht genügend nicht aktive Projekte gefunden');
    }

    // Wählen Sie das vorletzte Projekt aus der Liste
    const vorletztesProjekt = projekte[1];

    res.status(200).json(vorletztesProjekt);
  } catch (err) {
    console.error(err);
    res.status(500).send('Fehler beim Abrufen des Projekts');
  }
});*/


app.get('/api/vorletztes-nicht-aktives-projekt', async (req, res) => {
  try {
    const { produktionslinie, auftrag } = req.query;
//console.log(produktionslinie, auftrag)
    // Überprüfen, ob notwendige Parameter vorhanden sind
    if (!produktionslinie || !auftrag) {
      return res.status(400).send('Fehlende Parameter');
    }

    // Finden Sie das letzte nicht aktive Projekt, das Palettendaten enthält
    const projekt = await Projekt.findOne({
      produktionslinie: produktionslinie,
      Auftrag: auftrag,
      aktiv: false,
      palettenDaten: { $exists: true, $ne: {} } // Stellen Sie sicher, dass palettenDaten existiert und nicht leer ist
    }).sort({ startzeit: -1 }); // Sortieren nach Startzeit in absteigender Reihenfolge

    if (!projekt) {
      return res.status(404).send('Kein passendes Projekt gefunden');
    }

    res.status(200).json(projekt);
  } catch (err) {
    console.error(err);
    res.status(500).send('Fehler beim Abrufen des Projekts');
  }
});

app.get('/projekt', async (req, res) => {
  try {
    const { produktionslinie, auftrag, datum } = req.query;

    // Logik zum Finden des Projekts basierend auf den Parametern
    const projekt = await Projekt.findOne({ 
      produktionslinie: produktionslinie, 
      Auftrag: auftrag, 
      startzeit: new Date(datum) 
    });

    if (!projekt) {
      return res.status(404).send('Projekt nicht gefunden');
    }
    //console.log(projekt)
    res.status(200).json(projekt);
  } catch (err) {
    console.error(err);
    res.status(500).send('Fehler beim Abrufen des Projekts');
  }
});
app.put('/projekt/:projektId', async (req, res) => {
  try {
    const projektId = req.params.projektId;
    const projektDaten = req.body;
   // console.log(projektDaten)

    // Holen Sie das aktuelle Projekt, um die aktuelle Version zu erhalten
    const aktuellesProjekt = await Projekt.findById(projektId);
    if (!aktuellesProjekt) {
      return res.status(404).send('Projekt nicht gefunden');
    }

    // Erhöhen der Versionsnummer
    const neueVersion = aktuellesProjekt.version + 1;
    projektDaten.version = neueVersion;

    // Prüfen, ob bilanzierungBestaetigt gesetzt werden soll
    if (neueVersion === 2) {
      projektDaten.bilanzierungBestaetigt = true;
    }

    // Aktualisieren des Projekts
    const aktualisiertesProjekt = await Projekt.findByIdAndUpdate(projektId, projektDaten, { new: true });
    if (!aktualisiertesProjekt) {
      return res.status(404).send('Fehler beim Aktualisieren des Projekts');
    }

    res.status(200).json(aktualisiertesProjekt);
  } catch (err) {
    console.error(err);
    res.status(500).send('Serverfehler');
  }
});


app.get('/projekt/bricht', async (req, res) => {
  try {
    let { startDatum, endDatum, aktivStatus } = req.query;
    
    // Konvertieren Sie aktivStatus in einen Boolean
    const aktiv = aktivStatus === 'true';

    // Konvertierung der Datumswerte in Date-Objekte
    startDatum = new Date(startDatum);
    endDatum = new Date(endDatum);
    //console.log('Startdatum:', startDatum);
    //console.log('Enddatum:', endDatum);
    //console.log('Aktivstatus:', aktiv);
    
    // Überprüfen Sie, ob die Daten gültig sind
    if (isNaN(startDatum.valueOf()) || isNaN(endDatum.valueOf())) {
      return res.status(400).send('Ungültiges Datum.');
    }

    const projekte = await Projekt.find({
      startzeit: { $gte: startDatum, $lte: endDatum },
      aktiv: false
    })
//console.log(projekte)
    if (!projekte) {
      return res.status(404).send('Keine Projekte gefunden.');
    }

    res.json(projekte);
  } catch (err) {
    console.error(err);
    res.status(500).send('Serverfehler');
  }
});

app.get('/projekt/bricht/aktiv', async (req, res) => {
  try {
    // Abrufen von Projekten, die aktiv sind
    const aktiveProjekte = await Projekt.find({ aktiv: true });

    if (!aktiveProjekte || aktiveProjekte.length === 0) {
      return res.status(404).send('Keine aktiven Projekte gefunden.');
    }

    res.json(aktiveProjekte);
  } catch (err) {
    console.error(err);
    res.status(500).send('Serverfehler');
  }
});


app.patch('/projekt/:produktionslinienDaten/schicht', async (req, res) => {
  const { produktionslinienDaten } = req.params;
  const { arbeitsschicht } = req.body;

  try {
    const projekt = await Projekt.findOne({ produktionslinie: produktionslinienDaten, aktiv: true });
    if (!projekt) {
      return res.status(404).send('Projekt nicht gefunden');
    }

    projekt.arbeitsschicht = arbeitsschicht;
    await projekt.save();
    res.send(projekt);
  } catch (error) {
    res.status(500).send(error);
  }
});


function konvertiereZeitZuDate(basisDatum, uhrzeit) {
  const [stunden, minuten] = uhrzeit.split(':').map(Number);
  return new Date(basisDatum.setHours(stunden, minuten, 0, 0));
}

function handlePauseMitNeuemIntervall(projekt, pauseBeginn, schichtZuPrüfen) {
  if (projekt.arbeitsschicht === schichtZuPrüfen && projekt.aktiv) {
    projekt.mitarbeiter.forEach(mitarbeiter => {
      ['Produktionszeit', 'Ruestzeit', 'Wartezeit'].forEach(aktivitaet => {
        let offenesIntervall = mitarbeiter[aktivitaet].find(intervall => !intervall.ende);
        if (offenesIntervall) {
          // Beenden des aktuellen Intervalls
          offenesIntervall.ende = pauseBeginn;
          offenesIntervall.dauer = Math.round((pauseBeginn - new Date(offenesIntervall.start)) / 60000);

          // Neues Intervall beginnt 30 Minuten nach dem Ende des vorherigen Intervalls
          const neuesIntervallStart = new Date(pauseBeginn.getTime() + 30 * 60000);
          mitarbeiter[aktivitaet].push({
            nummer: mitarbeiter[aktivitaet].length + 1,
            start: neuesIntervallStart,
            ende: null,
            dauer: 0
          });
        }
      });
    });

    projekt.save();
  }
}

function handleendeIntervall(projekt, end, schichtZuPrüfen) {
  if (projekt.arbeitsschicht === schichtZuPrüfen && projekt.aktiv) {
    projekt.mitarbeiter.forEach(mitarbeiter => {
      ['Produktionszeit', 'Ruestzeit', 'Wartezeit'].forEach(aktivitaet => {
        let offenesIntervall = mitarbeiter[aktivitaet].find(intervall => !intervall.ende);
        if (offenesIntervall) {
          // Beenden des aktuellen Intervalls
          offenesIntervall.ende = end;
          offenesIntervall.dauer = Math.round((end - new Date(offenesIntervall.start)) / 60000);
          if (sindAlleMitarbeiterAbgemeldet(projekt)) {
            projekt.aktiv = false;
            projekt.endzeit = new Date();
            
          }
          // Neues Intervall beginnt 30 Minuten nach dem Ende des vorherigen Intervalls
          
        }
      });
    });

    projekt.save();
  }
}
function planePauseIntervalle() {
  const pauseZeiten = [
    { zeit: '10:00', schicht: 'Frühschicht' },
    { zeit: '11:30', schicht: 'Tagschicht' },
    { zeit: '18:00', schicht: 'Spätschicht' }
  ];
  const endZeiten = [
    { zeit: '14:00', schicht: 'Frühschicht' },
    { zeit: '16:00', schicht: 'Tagschicht' },
    { zeit: '22:00', schicht: 'Spätschicht' },
    { zeit: '12:00', schicht: 'Samstagschicht' }
  ];
  pauseZeiten.forEach(pause => {
    const verzögerung = konvertiereZeitZuDate(new Date(), pause.zeit) - new Date();
    if (verzögerung > 0) {
      setTimeout(() => {
        Projekt.find({ aktiv: true }).then(projekte => {
          projekte.forEach(projekt => {
            handlePauseMitNeuemIntervall(projekt, new Date(), pause.schicht);
          });
        });
      }, verzögerung);
    }
  });
  endZeiten.forEach(end => {
    const verzögerung = konvertiereZeitZuDate(new Date(), end.zeit) - new Date();
    if (verzögerung > 0) {
      setTimeout(() => {
        Projekt.find({ aktiv: true }).then(projekte => {
          projekte.forEach(projekt => {
            handleendeIntervall(projekt, new Date(), end.schicht);
          });
        });
      }, verzögerung);
    }
  });
}

planePauseIntervalle();

app.get('/projekte/Aktiv', async (req, res) => {
  try {
    // Finden Sie Projekte, die nicht aktiv sind und keine Palettendaten haben
    const Projekts = await Projekt.find({ 
      aktiv: true, 
      
    });

    if (Projekts.length === 0) {
      return res.status(404).send('Kein Projekt gefunden.');
    }
//console.log(Projekts)
    res.json(Projekts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Serverfehler');
  }
});

//Admin Produktion
app.post('/api/abmeldung/mitzeit', async (req, res) => {
  const { mitarbeiterName, uhrzeit } = req.body; // Uhrzeit im Format "HH:mm"
  
  try {
    // Ermitteln des aktuellen Datums ohne Uhrzeit
    const heute = new Date();
    const datumOhneUhrzeit = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());

    // Kombinieren des aktuellen Datums mit der vorgegebenen Uhrzeit
    const [stunden, minuten] = uhrzeit.split(':').map(Number);
    const vorgegebeneAbmeldeZeit = new Date(datumOhneUhrzeit);
    vorgegebeneAbmeldeZeit.setHours(stunden, minuten);

    // Finde das aktuelle Projekt und den Mitarbeiter, um den Abmeldevorgang durchzuführen
    const aktuellesProjekt = await Projekt.findOne({ 'mitarbeiter.name': mitarbeiterName, aktiv: true });
    if (!aktuellesProjekt) {
      return res.status(404).send('Aktuelles Projekt mit diesem Mitarbeiter nicht gefunden.');
    }

    // Aktualisiere die entsprechenden Zeiten des Mitarbeiters
    const mitarbeiter = aktuellesProjekt.mitarbeiter.find(m => m.name === mitarbeiterName);
    // Hier sollten Sie die Logik implementieren, um die spezifische Zeit des Mitarbeiters zu aktualisieren
    // Zum Beispiel könnte das Ende der letzten Produktionszeit auf vorgegebeneAbmeldeZeit gesetzt werden

    // Speichere die Änderungen am Projekt
    await aktuellesProjekt.save();

    res.status(200).json({
      message: `Mitarbeiter ${mitarbeiterName} erfolgreich abgemeldet.`,
      abmeldezeit: vorgegebeneAbmeldeZeit
    });
  } catch (error) {
    console.error('Fehler bei der Abmeldung:', error);
    res.status(500).send('Interner Serverfehler');
  }
});

const port = 3002;
app.listen(port, 'kmapp.prestigepromotion.de', () => {
  console.log(`Server is running on http://kmapp.prestigepromotion.de:${port}`);
});
