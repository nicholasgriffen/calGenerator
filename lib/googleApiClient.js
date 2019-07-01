require('dotenv').config();
const { google } = require('googleapis');
const sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

var oAuth2Client;

function setGlobalAuthClient(req, res, next) {
    var { client_secret, client_id, redirect_uri } = process.env;
    authorize({ client_secret, client_id, redirect_uri }, function (client) {
        oAuth2Client = client;
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
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Redirecting to: ', authUrl);
    res.redirect(authUrl);
}

function handleInboundAuthRedirect(req, res, next) {

    var code = req.query.code

    oAuth2Client.getToken(code, function (err, token) {
        if (err) next(`Error while trying to retrieve access token ${err}`);

        oAuth2Client.setCredentials(token);

        sheets.spreadsheets.get({
            spreadsheetId: '1FNYZBFsPYWxDiXIjYvihTlSbT11hWmHw90zfGGBNRXg',
            auth: oAuth2Client,
            includeGridData: true
        }, function (err, response) {
            if (err) return next(err);
            res.status(200).json(
                response.data.sheets
                    .filter(sheet => sheet.properties.title.includes('Week'))
                    .map(sheet => ({
                        title: sheet.properties.title,
                        data: sheet.data,
                        gridProperties: sheet.properties.gridProperties
                    })));
        })

    });
}

module.exports = {
    setGlobalAuthClient,
    getNewToken,
    handleInboundAuthRedirect
}
