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
      host: "-",
      port: 5432,
      database: "-",
      user: "postgres",
      password: "-"
    });

    const mongoClient = await MongoClient.connect("mongodb://localhost:27017/");
    const mongoDb = mongoClient.db("HA");
    const mongoCollection = mongoDb.collection("Simab Aufträge");

    const pgClient = await pgPool.connect();
    const sqlQuery = `-r`;

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
