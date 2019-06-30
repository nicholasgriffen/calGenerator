const express = require('express');
const api = require('./googleApiClient');
const PORT = process.env.PORT || 3000;

const app = express();

app.get('/', api.setGlobalAuthClient, api.getNewToken)

// Google API will redirect to this URL 
// with a query param code
app.get('/auth/', api.handleInboundAuthRedirect)

app.use(function (err, req, res, next) {
    res.status = err.status || '500'
    res.json({
        status: res.status,
        error: err,
        message: "Something went terribly wrong"
    })
})

app.listen(PORT, () => console.log('listening on ' + PORT))