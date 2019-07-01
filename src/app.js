const express = require('express');
const api = require('../lib/googleApiClient');
const PORT = process.env.PORT || 3000;

const app = express();

app.get('/', api.setGlobalAuthClient, api.getNewToken)

app.get('/auth', api.handleInboundAuthRedirect)

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