const { Pool } = require('pg');

async function main() {
  try {
    const pgPool = new Pool({
      host: "192.168.0.19",
      port: 5432,
      database: "25034PP",
      user: "postgres",
      password: "pp20181121"
    });

    // Hier können Sie Ihre SQL-Abfrage definieren
    const sqlQuery = 'SELECT * FROM IhreTabelle'; // Ersetzen Sie 'IhreTabelle' mit dem Namen Ihrer Tabelle

    // Verwenden Sie den Pool, um eine Client-Verbindung zu erhalten
    const client = await pgPool.connect();

    try {
      // Führen Sie die Abfrage aus
      const res = await client.query(sqlQuery);
      console.log(res.rows); // Zeigt die Ergebnisse der Abfrage an
    } finally {
      // Geben Sie den Client zurück in den Pool
      client.release();
    }
  } catch (err) {
    console.error('Ein Fehler ist aufgetreten', err);
  } finally {
    // Schließen Sie den Pool
    pgPool.end();
  }
}

main();
