const millisecondsInDay = 86400000;

function calculateDate(startDate, week, day) {
    var weekModifier = (week - 1) * 7 * millisecondsInDay;
    var dayModifier = (day - 1) * millisecondsInDay;

    var date = new Date(startDate.getTime() + weekModifier + dayModifier)
    return date;
}

function formatTimes(record) {
    var [start, end] = record['Time'].split('-').map(x => x.toUpperCase().trim())
    var startHour = findHour(start)
    var endHour = findHour(end)
    start = validateTimeFormat(setStartAmPm(start, end, startHour, endHour), startHour)
    end = validateTimeFormat(end, endHour)

    return [start, end]
}

function findHour(time) {
    return time.includes(':') ? +time.split(':')[0]
        : time.includes('AM') ? +time.split('AM')[0]
            : time.includes('PM') ? +time.split('PM')[0]
                : +time
}

function validateTimeFormat(time, hour) {
    if (time.includes('PM') && hour < 12) {
        hour = hour + 12;
    }

    if (time.includes(':')) {
        let tempTime = time.split(':')
        tempTime[0] = hour < 10 ? `0${hour}` : `${hour}`
        time = tempTime.join(':')

        if (time.includes('AM')) {
            time = time.split('AM').join(':00')
        }

        if (time.includes('PM')) {
            time = time.split('PM').join(':00')
        }
    }
    if (!time.includes(':')) {
        if (time.includes('AM')) {
            time = time.split('AM').join(':00:00')
        } else if (time.includes('PM')) {
            time = time.split('PM').join(':00:00')
        }
    }
    return time;
}

function setStartAmPm(start, end, startHour, endHour) {
    if (!(start.includes('AM') || start.includes('PM'))) {
        if (end.includes('PM')) {
            if (endHour === 12 && startHour < 12) {
                start += 'AM';
            } else {
                start += 'PM'
            }
        } else {
            start += 'AM'
        }
    }
    return start;
}
module.exports = {
    calculateDate,
    formatTimes
}