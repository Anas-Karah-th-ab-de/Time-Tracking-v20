const { MongoClient } = require('mongodb');
const { Pool } = require('pg');
const Decimal = require('decimal.js');
const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('error_log.txt', { flags: 'a' });
const logStdout = process.stdout;

console.log = function (msg) {
  logFile.write(util.format(msg) + '\n');
  logStdout.write(util.format(msg) + '\n');
};
console.error = console.log;

function convertSqlValue(value) {
  if (value instanceof Decimal) {
    return value.toString();
  }
  return value;
}

async function main() {
  try {
    const pgPool = new Pool({
      host: "192.168.0.19",
      port: 5432,
      database: "25034PP",
      user: "postgres",
      password: "pp20181121"
    });

    const mongoClient = await MongoClient.connect("mongodb://localhost:27017/");
    const mongoDb = mongoClient.db("HA");
    const mongoCollection = mongoDb.collection("Simab Aufträge");

    const pgClient = await pgPool.connect();
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
   ORDER BY ordera.artnr, orderk.nr`;

    const res = await pgClient.query(sqlQuery);
    console.log(`Anzahl der Zeilen aus der SQL-Abfrage: ${res.rows.length}`);

    let lastFpartnr = null;
    let lastAuftragsnr = null;
    let posCounter = 1;

    for (let row of res.rows) {
      const document = {};
      for (let [key, value] of Object.entries(row)) {
        document[key] = convertSqlValue(value);
      }

      if (lastFpartnr === document['fpartnr'] && lastAuftragsnr === document['auftragsnr']) {
        posCounter += 1;
      } else {
        posCounter = 1;
      }

      lastFpartnr = document['fpartnr'];
      lastAuftragsnr = document['auftragsnr'];

      document['pos'] = posCounter;

      const result = await mongoCollection.updateOne(
        { "auftragsnr": document.auftragsnr },
        { $set: document },
        { upsert: true }
      );

      console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`);
    }

    pgClient.release();
    await mongoClient.close();
  } catch (e) {
    console.error(`Es trat ein Fehler auf: ${e}`);
  }
}

main().catch(console.error);
