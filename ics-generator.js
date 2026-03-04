const ics = require('ics');

function parseWeekPattern(pattern) {
    const weeks = [];
    const parts = pattern.split(',').map(p => p.trim());
    
    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) {
                weeks.push(i);
            }
        } else {
            const val = Number(part);
            if (!isNaN(val)) weeks.push(val);
        }
    }
    return weeks;
}

function processTemplate(template, data) {
    if (!template) return '';
    return template.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}

function generateICS(timetableData, options = {}) {
    const events = [];
    const reminderMinutes = options.reminderMinutes || 15;
    
    // Default templates if not provided
    const titleTpl = options.titleTemplate || '${name} (${activityType})';
    const locTpl = options.locationTemplate || '${location}';
    const descTpl = options.descTemplate || 'Module: ${moduleId}\\nStaff: ${staff}\\nType: ${activityType}\\nWeek ${week}';
    
    // We no longer rely strictly on baseDate calculation. 
    // We try to pull the specific week from weekDatesMapping.
    
    for (const item of timetableData) {
        const weeks = parseWeekPattern(item.weekPattern);
        const dayOffset = parseInt(item.scheduledDay, 10); // 0=Mon, 1=Tue...
        
        const startVirtual = new Date(item.startTime);
        const endVirtual = new Date(item.endTime);
        
        // These are conceptually UTC hours that map to Chinese Standard Time if the calendar assumes UTC.
        // E.g., 03:00 UTC = 11:00 CST.
        const startHours = startVirtual.getUTCHours();
        const startMinutes = startVirtual.getUTCMinutes();
        
        const endHours = endVirtual.getUTCHours();
        const endMinutes = endVirtual.getUTCMinutes();

        for (const week of weeks) {
            let baseMonday;
            const mapping = options.weekDatesMapping || {};
            
            if (mapping[week]) {
                baseMonday = new Date(mapping[week]);
            } else if (mapping[1]) {
                // Fallback: Calculate naively from Week 1 if specific week isn't mapped
                baseMonday = new Date(mapping[1]);
                baseMonday.setDate(baseMonday.getDate() + (week - 1) * 7);
            } else {
                // Fallback: Calculate from today (should ideally not be reached)
                baseMonday = new Date();
                // Set to nearest Monday
                const day = baseMonday.getDay();
                const diff = baseMonday.getDate() - day + (day == 0 ? -6 : 1);
                baseMonday.setDate(diff);
                baseMonday.setDate(baseMonday.getDate() + (week - 1) * 7);
            }
            
            baseMonday.setHours(0, 0, 0, 0);

            // Calculate the actual date of the class
            const classDate = new Date(baseMonday);
            // Add days (dayOffset is 0 for Monday, 1 for Tue etc)
            classDate.setDate(classDate.getDate() + dayOffset);
            
            // Prepare template context
            const ctx = {
                name: item.name || '',
                activityType: item.activityType || '',
                moduleId: item.moduleId || '',
                staff: item.staff || '',
                location: item.location || '',
                week: week
            };
            
            const enableReminder = options.enableReminder !== false; // true by default

            const event = {
                title: processTemplate(titleTpl, ctx),
                description: processTemplate(descTpl, ctx),
                location: processTemplate(locTpl, ctx) || 'Unknown Location',
                // ics expects [year, month (1-12), day, hour, minute] in UTC if startInputType = 'utc'
                start: [classDate.getFullYear(), classDate.getMonth() + 1, classDate.getDate(), startHours, startMinutes],
                end: [classDate.getFullYear(), classDate.getMonth() + 1, classDate.getDate(), endHours, endMinutes],
                startInputType: 'utc',
                endInputType: 'utc',
                categories: [item.moduleId, item.activityType]
            };
            
            if (enableReminder) {
                event.alarms = [
                    { action: 'display', description: 'Class Reminder', trigger: { minutes: reminderMinutes, before: true } }
                ];
            }
            
            events.push(event);
        }
    }
    
    const { error, value } = ics.createEvents(events);
    
    if (error) {
        console.error('Error generating ICS:', error);
        throw error;
    }
    
    return value;
}

module.exports = { generateICS };
