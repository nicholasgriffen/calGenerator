require('dotenv').config();

const express = require('express');
const { setGlobalSpreadsheetId,
    setGlobalAuthClient,
    setGlobalStartDate,
    getNewToken,
    handleInboundAuthRedirect,
    getSpreadsheetValues,
    sendCsv } = require('../lib/googleApiClient');
const { makeCsv } = require('../lib/csv')

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static('public'));

app.get('/search', setGlobalSpreadsheetId, setGlobalStartDate, setGlobalAuthClient, getNewToken)

app.get('/auth', handleInboundAuthRedirect, getSpreadsheetValues, makeCsv, sendCsv)

app.use(function (req, res, next) {
    next({ status: 404, message: "No routes found" })
})

app.use(function (err, req, res, next) {
    res.status = err.status || 500
    res.json({
        status: res.status,
        error: err,
        message: err.message || "Something went terribly wrong"
    })
})

app.listen(PORT, () => console.log('listening on ' + PORT))