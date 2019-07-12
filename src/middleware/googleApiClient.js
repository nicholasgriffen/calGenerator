const { google } = require('googleapis');
const sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/calendar'];

var globals = {
    oAuth2Client: null,
    SPREADSHEET_ID: "Replace this with the id of a Google Spreadsheet",
    START_DATE: null,
    JUNIOR_COHORT: '',
    SENIOR_COHORT: ''
};

function setGlobalSpreadsheetId(req, res, next) {
    globals.SPREADSHEET_ID = req.query.spreadsheet_id
    next()
}

function setGlobalStartDate(req, res, next) {
    globals.START_DATE = req.query.start_date
    next()
}

function setGlobalCohorts(req, res, next) {
    var juniorNumber = +req.query.junior_cohort < 10 ? `0${req.query.junior_cohort}` : `${req.query.junior_cohort}`
    var seniorNumber = +req.query.junior_cohort < 10 ? `0${+req.query.junior_cohort - 1}` : `${+req.query.junior_cohort - 1}`
    globals.JUNIOR_COHORT = 'BLD' + juniorNumber
    globals.SENIOR_COHORT = 'BLD' + seniorNumber
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

function sendCsvToCalendar(req, res, next) {
    var juniorData = req.calendar.junior
    var seniorData = req.calendar.senior
    var juniorCalId, seniorCalId;
    const calendar = google.calendar({ version: 'v3', auth: globals.oAuth2Client })

    calendar.calendars.insert({
        resource: {
            summary: globals.JUNIOR_COHORT + ' Academic Calendar'
        },
    }).then(async cal => {
        var event, resource;
        juniorCalId = cal.data.id

        while (resource = juniorData.pop()) {
            await wait(500);
            event = await calendar.events.insert({
                calendarId: juniorCalId,
                resource: resource
            })
        }
        return event
    })
        .catch(e => {
            calendar.calendars.delete({
                calendarId: juniorCalId
            }).then(() => next(e)).catch(e => next(e))
        })
        .then(lastJuniorEvent => {
            if (!lastJuniorEvent) return

            console.log('last junior event added: ', lastJuniorEvent)

            return calendar.calendars.insert({
                resource: {
                    summary: globals.SENIOR_COHORT + ' Academic Calendar'
                },
            }).then(async cal => {
                var event, resource;
                seniorCalId = cal.data.id

                await wait(1000)

                while (resource = seniorData.pop()) {
                    await wait(500);
                    event = await calendar.events.insert({
                        calendarId: seniorCalId,
                        resource: resource
                    })
                }
                return event
            }).catch(e => {
                calendar.calendars.delete({
                    calendarId: seniorCalId
                }).then(() => next(e)).catch(e => next(e))
            })
        })

    res.status(200).json({
        message: `Your calendars are being made, please check your calendar in a little while for calendars called ${globals.JUNIOR_COHORT} Academic Calendar and ${globals.SENIOR_COHORT} Academic Calendar`,
        payload: { juniorCsv: req.csv.junior, seniorCsv: req.csv.senior }
    })
}

var wait = function (time) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve(true);
        }, time);
    });
};

module.exports = {
    setGlobalSpreadsheetId,
    setGlobalStartDate,
    setGlobalCohorts,
    setGlobalAuthClient,
    getNewToken,
    handleInboundAuthRedirect,
    getSpreadsheetValues,
    sendCsvToCalendar
}
