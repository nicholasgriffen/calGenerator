const { parse, stringify } = require('csv');
const { calculateDate, formatTimes } = require('./timeUtils')

const parseOptions = {
    columns: true,
    rtrim: true,
    ltrim: true,
    skip_lines_with_error: true
};

const stringifyOptions = {
    header: true,
    columns: ["Start Date", "End Date", "Start Time", "End Time", "Subject"]
}


function convertToGoogleCalendarCsv(stream, startDate) {
    var output = { senior: [], junior: [] };
    let record, row, day, cohort, week, weekModifier;
    while (record = stream.read()) {
        row = {}
        day = day || +record['Day'];
        week = record['Week'] ? +record['Week'].split(' ')[1] : week; // Expect format like "Week":"Week 01"

        if (week > 6) {
            cohort = 'senior'
            weekModifier = week - 6
        } else {
            cohort = 'junior'
            weekModifier = week
        }

        setStartAndEndDate(row, calculateDate(startDate, weekModifier, day).toLocaleDateString());
        setStartAndEndTime(row, record);
        setSubject(row, record);
        output[cohort].push(row)
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
    row['Subject'] = `${record['Type']}: ${record['Lecture / Activity / Exercise']}`
}


module.exports = {
    makeCsv: function (req, res, next) {
        // this invocation intentionally omits stringifyOptions
        // do not want to prepend the GCAL header row on the CSV yet
        Promise.all(req.sheetData.map(function (sheetData) {
            return new Promise(function (resolve, reject) {
                stringify(sheetData, function (err, data) {
                    if (err) return reject(err);
                    parse(data, parseOptions).on('readable', function () {
                        var convertedData = convertToGoogleCalendarCsv(this, new Date(req.startDate) || new Date('July 15, 2019'));

                        stringify(convertedData.senior, stringifyOptions, function (err, seniorData) {
                            if (err) return reject(err);
                            stringify(convertedData.junior, stringifyOptions, function (err, juniorData) {
                                if (err) return reject(err)
                                resolve([seniorData, juniorData])
                            })
                        })
                    }).on('error', function (e) { next(e) })
                })
            })
        })).then(csvs => {
            console.log('csvs', csvs)
            req.seniorCsvString = csvs.map(csv => csv[0]);
            req.juniorCsvString = csvs.map(csv => csv[1]);
            next()
        }
        ).catch(e => console.error(e))
    }
}


