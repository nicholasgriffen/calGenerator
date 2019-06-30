const express = require('express');
const api = require('./googleApiClient');
const PORT = process.env.PORT || 3000;

const app = express();

app.get('/', api.handleInitialAuth)

app.get('/auth/', function (req, res, next) {
    var code = req.params.code
    oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error while trying to retrieve access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
    });
})

app.listen(PORT, () => console.log('listening on ' + PORT))