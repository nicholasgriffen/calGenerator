const { google } = require('googleapis');
const sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

var globals = {
    oAuth2Client: null,
    SPREADSHEET_ID: "Replace this with the id of a Google Spreadsheet",
    START_DATE: null
};

function setGlobalSpreadsheetId(req, res, next) {
    globals.SPREADSHEET_ID = req.query.spreadsheet_id
    next()
}

function setGlobalStartDate(req, res, next) {
    globals.START_DATE = req.query.start_date
    next()
}

function setGlobalAuthClient(req, res, next) {
    var { client_secret, client_id, redirect_uri } = process.env;
    authorize({ client_secret, client_id, redirect_uri }, function (client) {
        globals.oAuth2Client = client;
        next();
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

function authorize({ client_secret, client_id, redirect_uri }, callback) {
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uri);

    return callback(oAuth2Client);
}

function getNewToken(req, res, next) {
    const authUrl = globals.oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Redirecting to: ', authUrl);
    res.redirect(authUrl);
}

function handleInboundAuthRedirect(req, res, next) {
    var code = req.query.code

    globals.oAuth2Client.getToken(code, function (err, token) {
        if (err) next(`Error while trying to retrieve access token ${err}`);
        globals.oAuth2Client.setCredentials(token);
        next()
    })
}

function getSpreadsheetValues(req, res, next) {
    var options = {
        spreadsheetId: globals.SPREADSHEET_ID,
        auth: globals.oAuth2Client
    }

    req.startDate = globals.START_DATE

    sheets.spreadsheets.get({
        ...options,
        fields: "sheets.properties.title"
    }, function (err, response) {
        if (err) return next(err);
        var ranges = response.data.sheets.filter(sheet => sheet.properties.title.includes('Week')).map(sheet => `${sheet.properties.title}!A:F`)
        sheets.spreadsheets.values.batchGet({
            ...options,
            ranges,
        }, function (err, response) {
            if (err) return next(err)
            req.sheetData = response.data.valueRanges.map(sheet => sheet.values)
            return next()
        })
    })
}

function sendCsv(req, res, next) {
    var juniorData = req.juniorCsvString
        .map(s => s.replace(/Start Date\,End Date\,Start Time\,End Time\,Subject(\\n)?/g, ""))
        .reduce((acc, val) => acc + val, "Start Date,End Date,Start Time,End Time,Subject\\n")
    var seniorData = req.seniorCsvString
        .map(s => s.replace(/Start Date\,End Date\,Start Time\,End Time\,Subject(\\n)?/g, ""))
        .reduce((acc, val) => acc + val, "Start Date,End Date,Start Time,End Time,Subject\\n")
    res.set({ "Content-Type": "text/csv" });
    res.set({ "Content-Disposition": "attachment; filename=seniorCalendar.csv" });
    res.send(Buffer.from(seniorData));
}


module.exports = {
    setGlobalSpreadsheetId,
    setGlobalStartDate,
    setGlobalAuthClient,
    getNewToken,
    handleInboundAuthRedirect,
    getSpreadsheetValues,
    sendCsv
}
