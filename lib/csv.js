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
        row = {
            event: {
                start: {
                    timeZone: 'America/Denver'
                },
                end: {
                    timeZone: 'America/Denver'
                }
            },
            csv: {
            }
        }
        day = day || +record['Day'];
        week = record['Week'] ? +record['Week'].split(' ')[1] : week; // Expect format like "Week":"Week 01"

        if (week > 6) {
            cohort = 'senior'
            weekModifier = week - 6
        } else {
            cohort = 'junior'
            weekModifier = week
        }

        setStartAndEndDate(row, calculateDate(startDate, weekModifier, day));
        setStartAndEndTime(row, record);
        setSubject(row, record);
        output[cohort].push(row)
    }
    return output;
}

function setStartAndEndDate(row, date) {
    var formattedDate = `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${date.getDate()}T`
    
    row.csv['Start Date'] = date.toLocaleDateString();
    row.csv['End Date'] = date.toLocaleDateString();
    
    row.event.start.dateTime = formattedDate;
    row.event.end.dateTime = formattedDate;
}

function setStartAndEndTime(row, record) {
    var times = formatTimes(record);
    
    row.csv['Start Time'] = times.start.short
    row.csv['End Time'] = times.end.short;
    
    row.event.start.dateTime += times.start.long;
    row.event.end.dateTime += times.end.long;
}

function setSubject(row, record) {
    row['summary'] = `${record['Type']}: ${record['Lecture / Activity / Exercise']}`
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
                                return resolve({
                                    csv: [seniorData, juniorData],
                                    calendar: {
                                        convertedData
                                    }
                                })
                            })
                        })
                    }).on('error', function (e) { next(e) })
                })
            })
        })).then(parsedSheets => {
            req.csv = {
                senior: [],
                junior: []
            }
                
            req.calendar = {
                senior: [],
                junior: []
            }

            parsedSheets.forEach(sheet => {
                req.calendar.senior.push(sheet.calendar.senior)
                req.calendar.junior.push(sheet.calendar.junior)
            });
                
            req.csv.junior = parsedSheets.csv.junior
                .map(s => s.replace(/Start Date\,End Date\,Start Time\,End Time\,Subject(\\n)?/g, ""))
                .reduce((acc, val) => acc + val, "Start Date,End Date,Start Time,End Time,Subject\\n");
                
            req.csv.senior = parsedSheets.csv.senior
                .map(s => s.replace(/Start Date\,End Date\,Start Time\,End Time\,Subject(\\n)?/g, ""))
                .reduce((acc, val) => acc + val, "Start Date,End Date,Start Time,End Time,Subject\\n");
                
            req.calendar.senior = req.calendar.senior.flat()
            req.calendar.junior = req.calendar.junior.flat()

            next()
                
        }).catch(e => console.error(e))
    }
}


