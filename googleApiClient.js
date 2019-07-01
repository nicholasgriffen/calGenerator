const { google } = require('googleapis');
const fs = require('fs')
const sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

var oAuth2Client;

function setGlobalAuthClient(req, res, next) {
     var { client_secret, client_id, redirect_uris } = process.env; 
     
    authorize({ client_secret, client_id, redirect_uris }, function (client) {
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

function authorize({ client_secret, client_id, redirect_uris }, callback) {
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

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
    oAuth2Client.getToken(code, (err, token) => {
        if (err) next(`Error while trying to retrieve access token ${err}`);
        oAuth2Client.setCredentials(token);
        res.sendStatus(200)
    });
}

module.exports = {
    setGlobalAuthClient,
    getNewToken,
    handleInboundAuthRedirect
}
