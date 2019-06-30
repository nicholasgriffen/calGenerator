const { google } = require('googleapis');
const fs = require('fs')
const sheets = google.sheets('v4');


const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

function handleInitialAuth(req, res, next) {
        // Authorize a client with credentials from the environment
    var { client_secret, client_id, redirect_uris } = process.env; 
    
    authorize({ client_secret, client_id, redirect_uris }, function (client) {
            req.oAuth2Client = client;
            next();
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(req, res, next) {
    const authUrl = req.oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Redirecting to: ', authUrl);
    // replace prompt with redirect to authUrl 
    // get code from query param
    res.redirect(authUrl);
}

module.exports = {
    handleInitialAuth,
    getNewToken
}
