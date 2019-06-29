var csv = require('csv');
var fs = require('fs');
var calculateDate = require('./calculateDate')

var parse = csv.parse;
var csv = fs.readFileSync('test.csv');

var output = [];

var options = {
    // columns: true
};

parse(csv, options).on('readable', function () {
    let record;
    while (record = this.read()) {
        output.push(record.map(x => x.trim()))
    }
    fs.writeFileSync('testNoColumn.json', JSON.stringify(output))
});

// change header names 

// start and end date always the same  
// format time 