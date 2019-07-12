require('dotenv').config();

const express = require('express');
const { setGlobalSpreadsheetId,
    setGlobalAuthClient,
    setGlobalStartDate,
    setGlobalCohorts,
    getNewToken,
    handleInboundAuthRedirect,
    getSpreadsheetValues,
    sendCsvToCalendar } = require('./src/middleware/googleApiClient');
const { makeCsv } = require('./src/middleware/csv')

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static('public'));

app.get('/search', setGlobalSpreadsheetId, setGlobalStartDate, setGlobalCohorts, setGlobalAuthClient, getNewToken)

app.get('/auth', handleInboundAuthRedirect, getSpreadsheetValues, makeCsv, sendCsvToCalendar)

app.use(function (req, res, next) {
    next({ status: 404, message: "No routes found" })
})

app.use(function (err, req, res, next) {
    console.error(err);
    res.status = err.status || 500
    res.json({
        status: res.status,
        error: err,
        message: err.message || "Something went terribly wrong"
    })
})

app.listen(PORT, () => console.log('listening on ' + PORT))
