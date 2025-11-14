// FILENAME: src/lib/text/regex/index.js
// Regex Utilities - Production Grade

export class RegexUtils {
    static patterns = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        phone: /^(\+\d{1,3}[- ]?)?\d{10}$/,
        ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        ipv6: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
        hexColor: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
        date: /^\d{4}-\d{2}-\d{2}$/,
        time: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
        creditCard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/,
        ssn: /^\d{3}-\d{2}-\d{4}$/,
        zipCode: /^\d{5}(-\d{4})?$/,
        username: /^[a-zA-Z0-9_-]{3,16}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        htmlTag: /^<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)$/,
        json: /^[\],:{}\s]*$/
    };

    static validate(patternName, text) {
        const pattern = this.patterns[patternName];
        if (!pattern) {
            throw new Error(`Unknown pattern: ${patternName}`);
        }
        return pattern.test(text);
    }

    static match(pattern, text, flags = '') {
        const regex = new RegExp(pattern, flags);
        return text.match(regex);
    }

    static matchAll(pattern, text, flags = '') {
        const regex = new RegExp(pattern, flags);
        return Array.from(text.matchAll(regex));
    }

    static replace(pattern, text, replacement, flags = '') {
        const regex = new RegExp(pattern, flags);
        return text.replace(regex, replacement);
    }

    static replaceAll(pattern, text, replacement, flags = '') {
        const regex = new RegExp(pattern, flags + 'g');
        return text.replace(regex, replacement);
    }

    static split(pattern, text, flags = '') {
        const regex = new RegExp(pattern, flags);
        return text.split(regex);
    }

    static extractGroups(pattern, text, flags = '') {
        const regex = new RegExp(pattern, flags);
        const match = text.match(regex);
        
        if (!match) return null;
        
        const groups = {};
        for (let i = 1; i < match.length; i++) {
            groups[`group${i}`] = match[i];
        }
        
        return groups;
    }

    static escape(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static createPattern(options) {
        const {
            startsWith = '',
            endsWith = '',
            contains = '',
            minLength = 0,
            maxLength = Infinity,
            allowedChars = '.*',
            forbiddenChars = ''
        } = options;

        let pattern = '^';
        
        if (startsWith) pattern += this.escape(startsWith);
        
        pattern += `[${this.escape(allowedChars)}`;
        if (forbiddenChars) pattern += `^${this.escape(forbiddenChars)}`;
        pattern += `]`;
        
        if (minLength > 1 || maxLength < Infinity) {
            pattern += `{${minLength},${maxLength}}`;
        } else {
            pattern += '*';
        }
        
        if (contains) pattern += this.escape(contains);
        if (endsWith) pattern += this.escape(endsWith);
        
        pattern += '$';
        
        return pattern;
    }

    static testMultiple(patterns, text, options = {}) {
        const { requireAll = false } = options;
        
        if (requireAll) {
            return patterns.every(pattern => 
                typeof pattern === 'string' 
                    ? this.patterns[pattern]?.test(text)
                    : pattern.test(text)
            );
        } else {
            return patterns.some(pattern =>
                typeof pattern === 'string'
                    ? this.patterns[pattern]?.test(text)
                    : pattern.test(text)
            );
        }
    }

    static findCommonPattern(texts) {
        if (texts.length === 0) return null;
        
        // Find longest common prefix
        let prefix = texts[0];
        for (let i = 1; i < texts.length; i++) {
            while (texts[i].indexOf(prefix) !== 0) {
                prefix = prefix.substring(0, prefix.length - 1);
                if (prefix === '') return '.*';
            }
        }
        
        // Find longest common suffix
        let suffix = texts[0];
        for (let i = 1; i < texts.length; i++) {
            while (!texts[i].endsWith(suffix)) {
                suffix = suffix.substring(1);
                if (suffix === '') return '.*';
            }
        }
        
        if (prefix === '' && suffix === '') return '.*';
        if (prefix === suffix) return this.escape(prefix);
        
        return `^${this.escape(prefix)}.*${this.escape(suffix)}$`;
    }

    static generateFromExamples(examples) {
        if (examples.length === 0) return '.*';
        
        // Simple pattern generation from examples
        const first = examples[0];
        let pattern = '^';
        
        for (let i = 0; i < first.length; i++) {
            const char = first[i];
            const allSame = examples.every(ex => ex[i] === char);
            
            if (allSame) {
                pattern += this.escape(char);
            } else {
                const chars = new Set(examples.map(ex => ex[i]));
                if (chars.size === 1) {
                    pattern += this.escape(Array.from(chars)[0]);
                } else {
                    pattern += `[${Array.from(chars).map(c => this.escape(c)).join('')}]`;
                }
            }
        }
        
        pattern += '$';
        return pattern;
    }

    static benchmark(pattern, text, iterations = 1000) {
        const regex = new RegExp(pattern);
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            regex.test(text);
        }
        
        const end = performance.now();
        return {
            iterations,
            totalTime: end - start,
            averageTime: (end - start) / iterations,
            pattern,
            textLength: text.length
        };
    }

    static analyzePattern(pattern) {
        const regex = new RegExp(pattern);
        
        return {
            pattern,
            source: regex.source,
            flags: regex.flags,
        };
    }

    static createValidator(pattern, options = {}) {
        const {
            flags = '',
            customMessage = 'Validation failed',
            transform = null
        } = options;

        const regex = new RegExp(pattern, flags);

        return (text) => {
            const valueToTest = transform ? transform(text) : text;
            const isValid = regex.test(valueToTest);
            
            return {
                isValid,
                value: text,
                transformed: valueToTest,
                message: isValid ? 'Valid' : customMessage,
                pattern: regex.toString()
            };
        };
    }

    static createExtractor(pattern, groupNames = []) {
        const regex = new RegExp(pattern, 'g');

        return (text) => {
            const matches = [];
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                const extracted = { fullMatch: match[0] };
                
                groupNames.forEach((name, index) => {
                    extracted[name] = match[index + 1];
                });
                
                matches.push(extracted);
            }
            
            return matches;
        };
    }
}

// Common regex validators
export const Validators = {
    email: (email) => RegexUtils.validate('email', email),
    url: (url) => RegexUtils.validate('url', url),
    phone: (phone) => RegexUtils.validate('phone', phone),
    ipv4: (ip) => RegexUtils.validate('ipv4', ip),
    ipv6: (ip) => RegexUtils.validate('ipv6', ip),
    hexColor: (color) => RegexUtils.validate('hexColor', color),
    date: (date) => RegexUtils.validate('date', date),
    creditCard: (card) => RegexUtils.validate('creditCard', card),
    ssn: (ssn) => RegexUtils.validate('ssn', ssn)
};

// Common regex extractors
export const Extractors = {
    emails: (text) => RegexUtils.matchAll(RegexUtils.patterns.email, text).map(m => m[0]),
    urls: (text) => RegexUtils.matchAll(RegexUtils.patterns.url, text).map(m => m[0]),
    phoneNumbers: (text) => RegexUtils.matchAll(RegexUtils.patterns.phone, text).map(m => m[0]),
    ipAddresses: (text) => [
        ...RegexUtils.matchAll(RegexUtils.patterns.ipv4, text).map(m => m[0]),
        ...RegexUtils.matchAll(RegexUtils.patterns.ipv6, text).map(m => m[0])
    ]
};

export default RegexUtils;
