const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const Decimal = require('decimal.js');
const winston = require('winston');

// Logger-Konfiguration
const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error_log.txt' })
    ]
});

// Hilfsfunktion, um SQL-Werte für MongoDB zu konvertieren
function convertSqlValue(value) {
    if (value instanceof Decimal) {
        return value.toString();
    }
    if (Buffer.isBuffer(value)) {
        try {
            return value.toString('utf-8');
        } catch (e) {
            return value.toString('latin1'); // Ersetzen Sie dies durch die erwartete Kodierung
        }
    }
    return value;
}

async function main() {
    try {
        // PostgreSQL-Verbindung
        const pgClient = new Client({
            host: "192.168.0.19",
            port: 5432,
            database: "25034PP",
            user: "postgres",
            password: "pp20181121"
        });
        await pgClient.connect();

        // MongoDB-Verbindung
        const mongoClient = new MongoClient("mongodb://kmapp.prestigepromotion.de:27017/");
        await mongoClient.connect();
        const mongoDb = mongoClient.db("auftragDB");
const mongoCollection = mongoDb.collection("auftrags");


        // SQL-Abfrage
        const sqlQuery = `SELECT orderk.nr AS auftragsnr,
        ordera.artnr AS fpartnr,
        artikel.artnr_extern AS fpartnr_extern,
        orderk.name1 AS kunde,
        ordera.pp_wa_charge AS wacharge,
        ordera.bezeichnun AS fpbezeichnung,
        ordera.menge AS sollmenge,
        orderk.pp_auf_nr_kunde AS kundenbestellnummer,
        orderk.status_individuell AS status,
        ( SELECT lookup.keytext
               FROM lookup
              WHERE lookup.subkey::text = artikel.pp_darreichungsform_alt::text AND lookup.key::text = 'DRF'::text) AS darreichungsform,
        order_sollchargen.artnr AS rohwarepackmittel_artnr,
        order_sollchargen.charge AS rohwarepackmittel_charge,
        ( SELECT artikel_1.bezeichnun
               FROM artikel artikel_1
              WHERE artikel_1.artnr::text = order_sollchargen.artnr::text) AS rohwarepackmittel_bezeichnung,
        order_sollchargen.pmenge AS we_menge,
        order_sollchargen.pos,
        ( SELECT artikel_1.code3
               FROM artikel artikel_1
              WHERE artikel_1.artnr::text = order_sollchargen.artnr::text) AS rohwareartnralternativ,
        artikel.pp_blflfs
       FROM orderk
         LEFT JOIN ordera ON orderk.nr = ordera.nr
         JOIN artikel ON ordera.artnr::text = artikel.artnr::text
         RIGHT JOIN order_sollchargen ON orderk.nr = order_sollchargen.nr
      WHERE ordera.artnr::text ~~ 'FP_%'::text AND order_sollchargen.partnr::text ~~ 'FP_%'::text OR ordera.artnr::text ~~ 'UE_%'::text AND order_sollchargen.partnr::text ~~ 'UE_%'::text AND orderk.status_individuell::text = '02'::text
       ORDER BY ordera.artnr, orderk.nr;`; // Fügen Sie Ihre SQL-Abfrage ein
        const pgRes = await pgClient.query(sqlQuery);

        console.log(`Anzahl der Zeilen aus der SQL-Abfrage: ${pgRes.rows.length}`);

        let lastFpartnr = null;
        let lastAuftragsnr = null;
        let posCounter = 1;

        for (const row of pgRes.rows) {
            const document = {};
            for (const [key, value] of Object.entries(row)) {
                document[key] = convertSqlValue(value);
            }

            // Überprüfen, ob fpartnr und auftragsnr denselben Wert wie im letzten Schritt haben
            if (lastFpartnr === document['fpartnr'] && lastAuftragsnr === document['auftragsnr']) {
                posCounter += 1;
            } else {
                posCounter = 1;
            }

            // Aktualisieren von lastFpartnr und lastAuftragsnr
            lastFpartnr = document['fpartnr'];
            lastAuftragsnr = document['auftragsnr'];

            // Setzen des Wertes von pos auf posCounter
            document['pos'] = posCounter;

            const result = await mongoCollection.updateOne(
                { auftragsnr: document.auftragsnr },
                { $set: document },
                { upsert: true }
            );

            console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`);
        }

        // Verbindungen schließen
        await pgClient.end();
        await mongoClient.close();
    } catch (e) {
        logger.error(`Es trat ein Fehler auf: ${e}`);
        console.error(`Ein Fehler trat auf: ${e}`);
    }
}

function startInterval() {
    main().catch(e => {
        logger.error(`Es trat ein Fehler auf: ${e}`);
        console.error(`Ein Fehler trat auf: ${e}`);
    });

    setInterval(() => {
        main().catch(e => {
            logger.error(`Es trat ein Fehler auf: ${e}`);
            console.error(`Ein Fehler trat auf: ${e}`);
        });
    }, 600000); // 600000 Millisekunden = 10 Minuten
}

// Starten des Intervalls
startInterval();
