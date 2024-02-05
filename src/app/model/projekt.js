const mongoose = require('mongoose');

const restPalettenSchema = new mongoose.Schema({
  paletten: Number,
  kartons: Number,
  stueckKarton: Number,
  stueckRestkarton: Number,
  gesamtmenge: Number
});
const palettenDatenSchema = new mongoose.Schema({
    vollePaletten: {
      paletten: Number,
      kartons: Number,
      stueckKarton: Number,
      gesamtmenge: Number
    },
    restPaletten: [restPalettenSchema], 
    gesamtDaten: {
      liefermenge: Number,
      musterKunde: Number,
      musterPP: Number,
      gesamtmenge: Number,
      ausschuss: Number,
      sumAusschusse:Number
    }
  });
  const zeitIntervallSchema = new mongoose.Schema({
    nummer: Number,
    start: Date,
    ende: Date,
    dauer:Number
  });
  
  const mitarbeiterSchema = new mongoose.Schema({
    // ... andere Felder ...
    _id:String,
    name: String,
    anmeldezeit:Date,
    stueckanzahl:Number,
    Produktionszeit: [zeitIntervallSchema],
    Ruestzeit: [zeitIntervallSchema],
    Wartezeit: [zeitIntervallSchema],
   
  });
  
const projektSchema = new mongoose.Schema({

  bilanzierungBestaetigt: {
    type: Boolean,
    default: false
  },
  Auftrag: {
    type: String,

  },
  StundenWert: {
    type: String,
   
  },
  produktionslinie: {
    type: String,

  },
  arbeitsschicht: {
    type: String,

  },
  startzeit: {
    type: Date,
    default: Date.now
  },
  endzeit: {
    type: Date
  },

  mitarbeiter: [mitarbeiterSchema],
  aktiv: {
    type: Boolean,
    default: true
  },
  palettenDaten: palettenDatenSchema,
  auftragszeit: Number,
  version: {
    type: Number,
    default: 0
  },
});

const Projekt = mongoose.model('Projekt', projektSchema);

module.exports = Projekt;