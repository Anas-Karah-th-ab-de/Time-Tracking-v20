//Order.js
const mongoose = require('mongoose');

const AuftragSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    pos: Number,
    auftragsnr: Number,
    fpartnr: [String],
    fpartnr_extern: String,
    kunde: String,
    wacharge: String,
    fpbezeichnung: String,
    sollmenge: Number,
   

});

const Auftrag = auftragDbConnection.model('Auftrag', AuftragSchema);
module.exports = Auftrag;


