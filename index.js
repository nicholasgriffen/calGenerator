const csv = require('csv');
const fs = require('fs');
const calculateDate = require('./calculateDate')

const parse = csv.parse;
const inputFile = fs.readFileSync('testData/test.csv');


const options = {
    columns: true
};

const startDate = new Date('July 15, 2019')

var output = [];

parse(inputFile, options).on('readable', function () {
    let record, week, day, eventDate;
    while (record = this.read()) {
        // Expect format like "Week":"Week 01"
        week = record['Week'] ? record['Week'].split(' ')[1] : week;
        if (record['Day'] && +record['Day'] !== day) { // only calculate date if day changed
            day = +record['Day'];
            eventDate = calculateDate(startDate, week, day).toLocaleDateString();
        }

        setStartAndEndDate(record, eventDate);
        setStartAndEndTime(record);
        output.push(record)
    }
    fs.writeFileSync('testData/test.json', JSON.stringify(output))
});

// change header names 

// start and end date always the same  
// format time 

function setStartAndEndDate(row, date) {
    row['Start Date'] = date;
    row['End Date'] = date;
    delete row['Week'];
    delete row['Day'];
}

function setStartAndEndTime(row) {

}