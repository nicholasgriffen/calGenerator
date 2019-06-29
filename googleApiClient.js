// BEFORE RUNNING:
// ---------------
// 1. If not already done, enable the Google Sheets API
//    and check the quota for your project at
//    https://console.developers.google.com/apis/api/sheets
// 2. Install the Node.js client library by running
//    `npm install googleapis --save`

const { google } = require('googleapis');
var sheets = google.sheets('v4');

authorize(function (authClient) {
    var request = {
        // The spreadsheet to request.
        spreadsheetId: 'my-spreadsheet-id',  // TODO: Update placeholder value.

        // The ranges to retrieve from the spreadsheet.
        ranges: [],  // TODO: Update placeholder value.

        // True if grid data should be returned.
        // This parameter is ignored if a field mask was set in the request.
        includeGridData: false,  // TODO: Update placeholder value.

        auth: authClient,
    };

    sheets.spreadsheets.get(request, function (err, response) {
        if (err) {
            console.error(err);
            return;
        }

        // TODO: Change code below to process the `response` object:
        console.log(JSON.stringify(response, null, 2));
    });
});

function authorize(callback) {
    // TODO: Change placeholder below to generate authentication credentials. See
    // https://developers.google.com/sheets/quickstart/nodejs#step_3_set_up_the_sample
    //
    // Authorize using one of the following scopes:
    //   'https://www.googleapis.com/auth/drive'
    //   'https://www.googleapis.com/auth/drive.file'
    //   'https://www.googleapis.com/auth/drive.readonly'
    //   'https://www.googleapis.com/auth/spreadsheets'
    //   'https://www.googleapis.com/auth/spreadsheets.readonly'
    var authClient = null;

    if (authClient == null) {
        console.log('authentication failed');
        return;
    }
    callback(authClient);
}