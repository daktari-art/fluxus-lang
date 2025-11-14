// FILENAME: src/lib/time/date/index.js
// Date and Time Utilities - Production Grade

export class DateTimeUtils {
    static now() {
        return new Date();
    }

    static today() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    static tomorrow() {
        const today = this.today();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    }

    static yesterday() {
        const today = this.today();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    }

    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }

    static addMinutes(date, minutes) {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }

    static addSeconds(date, seconds) {
        const result = new Date(date);
        result.setSeconds(result.getSeconds() + seconds);
        return result;
    }

    static differenceInDays(date1, date2) {
        const time1 = date1.getTime();
        const time2 = date2.getTime();
        return Math.floor((time1 - time2) / (1000 * 60 * 60 * 24));
    }

    static differenceInHours(date1, date2) {
        const time1 = date1.getTime();
        const time2 = date2.getTime();
        return Math.floor((time1 - time2) / (1000 * 60 * 60));
    }

    static differenceInMinutes(date1, date2) {
        const time1 = date1.getTime();
        const time2 = date2.getTime();
        return Math.floor((time1 - time2) / (1000 * 60));
    }

    static isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    static isToday(date) {
        return this.isSameDay(date, new Date());
    }

    static isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    static isWeekday(date) {
        return !this.isWeekend(date);
    }

    static startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    static endOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    }

    static startOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    static endOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    static startOfYear(date) {
        return new Date(date.getFullYear(), 0, 1);
    }

    static endOfYear(date) {
        return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    static getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    static format(date, formatString = 'YYYY-MM-DD') {
        const tokens = {
            YYYY: date.getFullYear(),
            YY: String(date.getFullYear()).slice(-2),
            MM: String(date.getMonth() + 1).padStart(2, '0'),
            M: date.getMonth() + 1,
            DD: String(date.getDate()).padStart(2, '0'),
            D: date.getDate(),
            HH: String(date.getHours()).padStart(2, '0'),
            H: date.getHours(),
            mm: String(date.getMinutes()).padStart(2, '0'),
            m: date.getMinutes(),
            ss: String(date.getSeconds()).padStart(2, '0'),
            s: date.getSeconds(),
            SSS: String(date.getMilliseconds()).padStart(3, '0')
        };

        return formatString.replace(
            /YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|SSS/g,
            match => tokens[match]
        );
    }

    static parse(dateString, formatString = 'YYYY-MM-DD') {
        // Simple parser for common formats
        if (formatString === 'YYYY-MM-DD') {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        
        if (formatString === 'MM/DD/YYYY') {
            const [month, day, year] = dateString.split('/').map(Number);
            return new Date(year, month - 1, day);
        }
        
        if (formatString === 'DD/MM/YYYY') {
            const [day, month, year] = dateString.split('/').map(Number);
            return new Date(year, month - 1, day);
        }
        
        // Fallback to Date constructor
        return new Date(dateString);
    }

    static isValid(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    static isBefore(date1, date2) {
        return date1.getTime() < date2.getTime();
    }

    static isAfter(date1, date2) {
        return date1.getTime() > date2.getTime();
    }

    static isBetween(date, start, end) {
        const time = date.getTime();
        return time >= start.getTime() && time <= end.getTime();
    }

    static min(...dates) {
        return new Date(Math.min(...dates.map(d => d.getTime())));
    }

    static max(...dates) {
        return new Date(Math.max(...dates.map(d => d.getTime())));
    }

    static getAge(birthDate, referenceDate = new Date()) {
        const age = referenceDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
            return age - 1;
        }
        
        return age;
    }

    static getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    static getQuarter(date) {
        return Math.floor(date.getMonth() / 3) + 1;
    }

    static getBusinessDays(startDate, endDate) {
        let count = 0;
        const current = new Date(startDate);
        
        while (current <= endDate) {
            if (this.isWeekday(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return count;
    }

    static addBusinessDays(date, days) {
        let result = new Date(date);
        let added = 0;
        
        while (added < days) {
            result.setDate(result.getDate() + 1);
            if (this.isWeekday(result)) {
                added++;
            }
        }
        
        return result;
    }

    static getTimeZones() {
        return Intl.supportedValuesOf('timeZone');
    }

    static convertTimeZone(date, targetTimeZone, sourceTimeZone = 'UTC') {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: targetTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const parts = formatter.formatToParts(date);
        const partValues = {};
        
        parts.forEach(part => {
            if (part.type !== 'literal') {
                partValues[part.type] = part.value;
            }
        });
        
        return new Date(
            `${partValues.year}-${partValues.month}-${partValues.day}T${partValues.hour}:${partValues.minute}:${partValues.second}`
        );
    }

    static getUTCOffset(date, timeZone = 'UTC') {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'shortOffset'
        });
        
        const parts = formatter.formatToParts(date);
        const offsetPart = parts.find(part => part.type === 'timeZoneName');
        return offsetPart ? offsetPart.value : 'UTC';
    }

    static createDateRange(startDate, endDate, interval = 'day') {
        const range = [];
        let current = new Date(startDate);
        
        while (current <= endDate) {
            range.push(new Date(current));
            
            switch (interval) {
                case 'day':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'week':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'month':
                    current.setMonth(current.getMonth() + 1);
                    break;
                case 'year':
                    current.setFullYear(current.getFullYear() + 1);
                    break;
                default:
                    current.setDate(current.getDate() + 1);
            }
        }
        
        return range;
    }

    static getSeason(date) {
        const month = date.getMonth();
        const day = date.getDate();
        
        // Northern hemisphere seasons
        if (month < 2 || (month === 2 && day < 20)) return 'winter';
        if (month < 5 || (month === 5 && day < 21)) return 'spring';
        if (month < 8 || (month === 8 && day < 23)) return 'summer';
        if (month < 11 || (month === 11 && day < 21)) return 'autumn';
        return 'winter';
    }

    static isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    static getMoonPhase(date) {
        // Simple moon phase calculation (approximate)
        const knownNewMoon = new Date('2000-01-06'); // A known new moon date
        const lunarCycle = 29.530588853; // days in lunar cycle
        
        const daysSinceNewMoon = this.differenceInDays(date, knownNewMoon);
        const phase = (daysSinceNewMoon % lunarCycle) / lunarCycle;
        
        if (phase < 0.03 || phase > 0.97) return 'new moon';
        if (phase < 0.22) return 'waxing crescent';
        if (phase < 0.28) return 'first quarter';
        if (phase < 0.47) return 'waxing gibbous';
        if (phase < 0.53) return 'full moon';
        if (phase < 0.72) return 'waning gibbous';
        if (phase < 0.78) return 'last quarter';
        return 'waning crescent';
    }

    static getSunriseSunset(date, latitude, longitude) {
        // Simplified sunrise/sunset calculation
        // In real implementation, use proper astronomical formulas
        
        const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
        const solarNoon = 12; // Approximate solar noon
        
        // Very simplified calculation
        const sunrise = new Date(date);
        sunrise.setHours(6, 30, 0, 0);
        
        const sunset = new Date(date);
        sunset.setHours(18, 30, 0, 0);
        
        return {
            sunrise,
            sunset,
            dayLength: this.differenceInHours(sunset, sunrise)
        };
    }
}

// Additional utility functions
export const DateConstants = {
    MILLISECONDS_IN_DAY: 86400000,
    MILLISECONDS_IN_HOUR: 3600000,
    MILLISECONDS_IN_MINUTE: 60000,
    MILLISECONDS_IN_SECOND: 1000,
    
    DAYS_IN_WEEK: 7,
    MONTHS_IN_YEAR: 12,
    
    WEEKDAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    WEEKDAYS_SHORT: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    MONTHS_SHORT: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

export default DateTimeUtils;
