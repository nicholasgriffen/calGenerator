const { parse, stringify } = require('csv');
const fs = require('fs');
const { calculateDate, formatTimes } = require('./timeUtils')

const inputFile = fs.readFileSync('testData/test.csv');


const parseOptions = {
    columns: true,
    rtrim: true,
    ltrim: true
};

const stringifyOptions = {
    header: true,
    columns: ["Start Date", "End Date", "Start Time", "End Time", "Subject", "Description"]
}

const startDate = new Date('July 15, 2019')

var output = [];

parse(inputFile, parseOptions).on('readable', function () {
    var convertedFile = convertToGoogleCalendarCsv(this);
    stringify(convertedFile, stringifyOptions, function (err, data) {
        fs.writeFileSync('testData/newTest.csv', data);
    })
});

function convertToGoogleCalendarCsv(stream) {
    let record, week, day, eventDate, row;
    while (record = stream.read()) {
        row = {}
        week = record['Week'] ? record['Week'].split(' ')[1] : week; // Expect format like "Week":"Week 01"

        if (record['Day'] && +record['Day'] !== day) {
            // only calculate date if day changed
            // assume that record with empty day occurs 
            // on same day as the last record that had a day
            day = +record['Day'];
            eventDate = calculateDate(startDate, week, day).toLocaleDateString();
        }

        setStartAndEndDate(row, eventDate);
        setStartAndEndTime(row, record);
        setSubject(row, record);
        setDescription(row, record);
        output.push(row)
    }
    return output;
}
function setStartAndEndDate(row, date) {
    row['Start Date'] = date;
    row['End Date'] = date;
    delete row['Week'];
    delete row['Day'];
}

function setStartAndEndTime(row, record) {
    var [start, end] = formatTimes(record)
    row['Start Time'] = start;
    row['End Time'] = end;
}

function setSubject(row, record) {
    row['Subject'] = record['Type']
}

function setDescription(row, record) {
    row['Description'] = record['Lecture / Activity / Exercise']
}