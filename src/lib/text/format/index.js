// FILENAME: src/lib/text/format/index.js
// Text Formatting Utilities - Production Grade

export class TextFormatting {
    static formatNumber(value, options = {}) {
        const {
            locale = 'en-US',
            style = 'decimal',
            minimumFractionDigits = 0,
            maximumFractionDigits = 2,
            notation = 'standard'
        } = options;

        try {
            return new Intl.NumberFormat(locale, {
                style,
                minimumFractionDigits,
                maximumFractionDigits,
                notation
            }).format(value);
        } catch (error) {
            return String(value);
        }
    }

    static formatCurrency(amount, currency = 'USD', options = {}) {
        const {
            locale = 'en-US',
            display = 'symbol'
        } = options;

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            currencyDisplay: display
        }).format(amount);
    }

    static formatDate(date, format = 'medium', locale = 'en-US') {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        const formats = {
            short: { dateStyle: 'short', timeStyle: 'short' },
            medium: { dateStyle: 'medium', timeStyle: 'medium' },
            long: { dateStyle: 'long', timeStyle: 'long' },
            full: { dateStyle: 'full', timeStyle: 'full' },
            dateOnly: { dateStyle: 'medium' },
            timeOnly: { timeStyle: 'medium' }
        };

        const formatOptions = formats[format] || formats.medium;

        try {
            return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
        } catch (error) {
            return dateObj.toISOString();
        }
    }

    static formatRelativeTime(date, locale = 'en-US') {
        const now = new Date();
        const target = date instanceof Date ? date : new Date(date);
        const diffInSeconds = Math.floor((now - target) / 1000);

        const units = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1
        };

        for (const [unit, secondsInUnit] of Object.entries(units)) {
            const diff = Math.floor(diffInSeconds / secondsInUnit);
            
            if (diff >= 1) {
                const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
                return rtf.format(-diff, unit);
            }
        }

        return 'just now';
    }

    static pluralize(count, singular, plural = null) {
        if (count === 1) return `${count} ${singular}`;
        
        const pluralForm = plural || `${singular}s`;
        return `${count} ${pluralForm}`;
    }

    static truncate(text, maxLength, suffix = '...') {
        if (text.length <= maxLength) return text;
        
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    static capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    static titleCase(text) {
        return text.replace(/\w\S*/g, (word) =>
            word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
        );
    }

    static camelCase(text) {
        return text.replace(/[-_\s]+(.)?/g, (_, char) =>
            char ? char.toUpperCase() : ''
        );
    }

    static snakeCase(text) {
        return text
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s-]+/g, '_')
            .toLowerCase();
    }

    static kebabCase(text) {
        return text
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }

    static slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    static formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    static formatPercentage(value, decimals = 1) {
        return `${(value * 100).toFixed(decimals)}%`;
    }

    static maskText(text, visibleChars = 4, maskChar = '*') {
        if (text.length <= visibleChars * 2) {
            return text;
        }

        const firstPart = text.substring(0, visibleChars);
        const lastPart = text.substring(text.length - visibleChars);
        const maskedPart = maskChar.repeat(text.length - visibleChars * 2);

        return firstPart + maskedPart + lastPart;
    }

    static formatPhoneNumber(phoneNumber, format = 'us') {
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        const formats = {
            us: (num) => {
                if (num.length === 10) {
                    return `(${num.substring(0, 3)}) ${num.substring(3, 6)}-${num.substring(6)}`;
                }
                if (num.length === 11 && num[0] === '1') {
                    return `+1 (${num.substring(1, 4)}) ${num.substring(4, 7)}-${num.substring(7)}`;
                }
                return num;
            },
            international: (num) => {
                if (num.length === 10) {
                    return `+1${num}`;
                }
                return `+${num}`;
            }
        };

        const formatter = formats[format] || formats.us;
        return formatter(cleanNumber);
    }

    static formatSocialSecurity(ssn) {
        const cleanSSN = ssn.replace(/\D/g, '');
        
        if (cleanSSN.length === 9) {
            return `${cleanSSN.substring(0, 3)}-${cleanSSN.substring(3, 5)}-${cleanSSN.substring(5)}`;
        }
        
        return ssn;
    }

    static generateLoremIpsum(words = 50) {
        const loremWords = [
            'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
            'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor',
            'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna',
            'aliqua', 'enim', 'minim', 'veniam', 'quis', 'nostrud',
            'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip',
            'ex', 'ea', 'commodo', 'consequat'
        ];

        let result = '';
        for (let i = 0; i < words; i++) {
            const word = loremWords[Math.floor(Math.random() * loremWords.length)];
            result += (i === 0 ? this.capitalize(word) : word) + ' ';
            
            // Add punctuation occasionally
            if (i > 0 && i % 10 === 0 && i < words - 1) {
                result = result.trim() + '. ';
            }
        }

        return result.trim() + '.';
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static extractEmails(text) {
        const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
        return text.match(emailRegex) || [];
    }

    static extractURLs(text) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        return text.match(urlRegex) || [];
    }

    static countWords(text) {
        return text.trim().split(/\s+/).length;
    }

    static countCharacters(text, includeSpaces = true) {
        if (includeSpaces) {
            return text.length;
        }
        return text.replace(/\s/g, '').length;
    }

    static readingTime(text, wordsPerMinute = 200) {
        const wordCount = this.countWords(text);
        const minutes = wordCount / wordsPerMinute;
        
        if (minutes < 1) {
            return 'less than a minute';
        }
        
        const roundedMinutes = Math.ceil(minutes);
        return `${roundedMinutes} min read`;
    }
}

export default TextFormatting;
