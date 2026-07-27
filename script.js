const STORAGE_KEY = 'eodActivities';
const THEME_KEY = 'eodTheme';
const today = getTodayDateValue();
const SETTINGS_KEY = 'eodSettings';
let tampermonkeyDetected = false;
let selectedHistoryDate = null;
let editingActivityId = null;
let editingActivityDate = null;

// Initializion
initializeTheme();
initializeTime(); 


// Load activities on page load
loadActivities();
loadHistoryDates();


// Form submission
document.getElementById('entryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addActivity();
    updateAutomationStatus();
});

document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveEditedActivity();
    updateAutomationStatus();
});

document.getElementById('formsBtn').addEventListener('click', openForms);
document.getElementById('backupBtn').addEventListener('click', openBackupModal);
document.getElementById('restoreBtn').addEventListener('click', function() {
    document.getElementById('restoreInput').click();

});

document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);

document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettingsModal);

document.getElementById('settingsForm').addEventListener('submit', function (e) {

    e.preventDefault();

    saveSettingsFromForm();

});

document.getElementById('restoreInput').addEventListener('change', restoreActivitiesFromJson);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('exportTextBtn')
    ?.addEventListener('click', exportToText);

document.getElementById('copyReportBtn')
    ?.addEventListener('click', copyToClipboard);

document.getElementById('exportHistoryBtn')
    ?.addEventListener('click', exportSelectedReport);

document.getElementById('copyHistoryBtn')
    ?.addEventListener('click', copySelectedReport);

document.getElementById('cancelEditBtn')
    ?.addEventListener('click', closeEditModal);

document.getElementById('cancelBackupBtn')
    ?.addEventListener('click', closeBackupModal);

document.getElementById('confirmBackupBtn')
    ?.addEventListener('click', downloadSelectedBackup);

document.getElementById('backupSelectAll')
    ?.addEventListener('change', toggleSelectAllBackups);

document
    .getElementById('submitEodBtn')
    .addEventListener(
        'click',
        submitTodayEOD
    );

// COMPATIBILITY - MOBILE MENU

const menuToggle = document.getElementById('menuToggle');
const headerControls = document.getElementById('headerControls');

if (menuToggle && headerControls) {

    menuToggle.addEventListener('click', function (e) {

        e.stopPropagation();

        menuToggle.classList.toggle('active');
        headerControls.classList.toggle('show');

        menuToggle.setAttribute(
            'aria-expanded',
            headerControls.classList.contains('show')
        );
    });

    document.addEventListener('click', function (e) {

        if (
            !headerControls.contains(e.target) &&
            !menuToggle.contains(e.target)
        ) {

            menuToggle.classList.remove('active');
            headerControls.classList.remove('show');

            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', function (e) {

        if (e.key === 'Escape') {

            menuToggle.classList.remove('active');
            headerControls.classList.remove('show');

            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    headerControls.querySelectorAll('button').forEach(function (button) {

        button.addEventListener('click', function () {

            if (window.innerWidth <= 640) {

                menuToggle.classList.remove('active');
                headerControls.classList.remove('show');

                menuToggle.setAttribute('aria-expanded', 'false');

            }
        });
    });
}

function getTodayDateValue() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}`;
}

function formatFormsDate(dateString) {

    const [year, month, day] = dateString.split('-');

    return `${Number(month)}/${Number(day)}/${year}`;

}

function getCurrentTimeValue() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        hour12: false
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

    return `${values.hour}:${values.minute}`;
}

function initializeTime(){
    const dateInput = document.getElementById('date');
    dateInput.value = getTodayDateValue();

    let startTime = getCurrentTimeValue();
    const activities = getActivities(dateInput.value);
    if (activities.length > 0) {
        const sortedActivities = activities.slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
        startTime = sortedActivities.at(-1).endTime;
    }

    document.getElementById('startTime').value = startTime;
}

// Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">×</button>
    `;
    
    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', function () {
    removeToast(toast);
    });
    
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
}

function removeToast(element) {
    element.classList.add('removing');
    setTimeout(() => {
        element.remove();
    }, 300);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    updateThemeButton();
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    updateThemeButton();
}

/* ==========================================================
   SETTINGS
========================================================== */

const DEFAULT_SETTINGS = {

    version: 1,

    automationEnabled: true,

    autoBackup: true,

    autoOpenForm: true,

    formsUrl: 'https://forms.cloud.microsoft/pages/responsepage.aspx?id=VC0K9rQDFEWyn1uxr3fPC2pICO7P_hdMkKpJ5I4OTyFUNzVSOUZNSDVNNU5UUUVXSjMwOTE3OVdNNy4u&origin=lprLink&route=shorturl',

    employeeId: '',

    attendanceStatus: 'Present',

    starRating6: 5,

    starRating7: 5,

    defaultText8: '',

    defaultText9: ''

};

function getSettings() {

    const saved = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || '{}'
    );

    return {

        ...DEFAULT_SETTINGS,

        ...saved

    };

}

function saveSettings(settings) {

    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );

}

function resetSettings() {

    localStorage.removeItem(SETTINGS_KEY);

    return getSettings();

}

function buildAutomationPayload() {

    const settings = getSettings();

    const today = getTodayDateValue();

    return {

        empId: settings.employeeId,

        attendanceStatus: settings.attendanceStatus,

        date: formatFormsDate(today),

        report: generateReport(today),

        starRating6: settings.starRating6,

        starRating7: settings.starRating7,

        defaultText8: settings.defaultText8,

        defaultText9: settings.defaultText9

    };

}

function validateTodaySubmission() {

    const settingsValidation = validateAutomationSettings();

    if (!settingsValidation.valid) {

        showToast(
            'Please complete your automation settings.',
            'error'
        );

        openSettingsModal();

        return false;

    }

    const activities = getActivities(getTodayDateValue());

    if (activities.length === 0) {

        showToast(
            'No activities recorded for today.',
            'error'
        );

        return false;

    }

    return true;

}

function submitTodayEOD() {

    const settings = getSettings();

    if (!settings.automationEnabled) {

        showToast(
            'Automation is disabled.',
            'error'
        );

        return;

    }

    if (!validateTodaySubmission()) {

        return;

    }

    const payload = buildAutomationPayload();

    if (settings.autoBackup) {

        backupTodayActivities();

    }

    openForms(payload);

    showToast(
        'Opening Microsoft Forms...',
        'success'
    );

}

function openForms(payload = null) {

    const settings = getSettings();

    let url = settings.formsUrl;

    if (payload) {

        url += '#eodauto=' + encodeURIComponent(
            JSON.stringify(payload)
        );

    }

    window.open(url, '_blank');

}

function getAllActivities() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function downloadBackup(activities, fileName) {

    const backup = {

        app: 'EODauto',

        version: 1,

        exportedAt: new Date().toISOString(),

        activities

    };

    const json = JSON.stringify(backup, null, 2);

    const element = document.createElement('a');

    element.href =
        'data:application/json;charset=utf-8,' +
        encodeURIComponent(json);

    element.download = fileName;

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

}

function backupAllActivities() {

    const activities = getAllActivities();

    const dateStamp = new Date()
        .toISOString()
        .slice(0, 10);

    downloadBackup(

        activities,

        `EODauto_Backup_${dateStamp}.json`

    );

    showToast(
        'JSON backup downloaded',
        'success'
    );

}

function backupTodayActivities() {

    const today = getTodayDateValue();

    const activities = getActivities(today);

    if (activities.length === 0) {

        return;

    }

    const backup = {

        [today]: activities

    };

    downloadBackup(

        backup,

        `EODauto_Backup_${today}.json`

    );

}

/* ==========================================================
   BACKUP MODAL
========================================================== */

function openBackupModal() {

    const list = document.getElementById('backupDateList');

    const allActivities = getAllActivities();

    const dates = Object.keys(allActivities)
        .sort()
        .reverse();

    list.innerHTML = '';

    if (dates.length === 0) {

        list.innerHTML = `
            <p style="text-align:center;color:var(--text-secondary);padding:24px;">
                No activities available to back up.
            </p>
        `;

    } else {

        dates.forEach(date => {

            const activities = allActivities[date];

            const row = document.createElement('label');

            row.className = 'backup-date';

            row.innerHTML = `
                <div class="backup-left">

                    <input
                        type="checkbox"
                        class="backup-checkbox"
                        value="${date}"
                        checked>

                    <div class="backup-info">

                        <div class="backup-date-title">
                            ${formatDateDisplay(date)}
                        </div>

                        <div class="backup-date-subtitle">
                            ${activities.length} ${activities.length === 1 ? 'Activity' : 'Activities'}
                        </div>

                    </div>

                </div>
            `;

            list.appendChild(row);

        });

    }

    document
        .querySelectorAll('.backup-checkbox')
        .forEach(cb => {

            cb.addEventListener('change', updateBackupSummary);

        });

    document.getElementById('backupSelectAll').checked = true;

    updateBackupSummary();

    document.getElementById('backupModal').classList.add('show');

}

function closeBackupModal() {

    document
        .getElementById('backupModal')
        .classList.remove('show');

}

function toggleSelectAllBackups(event) {

    const checked = event.target.checked;

    document
        .querySelectorAll('.backup-checkbox')
        .forEach(cb => {

            cb.checked = checked;

        });

    updateBackupSummary();

}

function updateBackupSummary() {

    const checked = document.querySelectorAll('.backup-checkbox:checked');

    const allActivities = getAllActivities();

    let totalActivities = 0;

    checked.forEach(cb => {

        totalActivities += allActivities[cb.value].length;

    });

    document.getElementById('backupSummary').innerHTML = `
        Selected:
        <strong>${checked.length} ${checked.length === 1 ? 'date' : 'dates'}</strong>
        •
        <strong>${totalActivities} ${totalActivities === 1 ? 'activity' : 'activities'}</strong>
    `;

    document.getElementById('confirmBackupBtn').disabled = checked.length === 0;

}

function downloadSelectedBackup() {

    const checked = document.querySelectorAll('.backup-checkbox:checked');

    if (!checked.length) {

        showToast('Please select at least one date.', 'error');

        return;

    }

    const allActivities = getAllActivities();

    const selectedActivities = {};

    checked.forEach(cb => {

        selectedActivities[cb.value] = allActivities[cb.value];

    });

    const backup = {

        app: 'EODauto',

        version: 1,

        exportedAt: new Date().toISOString(),

        activities: selectedActivities

    };

    const json = JSON.stringify(backup, null, 2);

    const dates = Object.keys(selectedActivities).sort();

    let filename;

    if (dates.length === 1) {

        filename = `EODauto_Backup_${dates[0]}.json`;

    } else {

        filename = `EODauto_Backup_${dates[0]}_to_${dates[dates.length-1]}.json`;

    }

    const element = document.createElement('a');

    element.href =
        'data:application/json;charset=utf-8,' +
        encodeURIComponent(json);

    element.download = filename;

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

    closeBackupModal();

    showToast('Backup downloaded successfully!', 'success');

}

function restoreActivitiesFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(loadEvent) {
        try {
            const parsed = JSON.parse(loadEvent.target.result);
            const importedActivities = parsed.activities || parsed;

            if (!isValidActivityStore(importedActivities)) {
                showToast('Invalid EOD backup file', 'error');
                return;
            }

            mergeActivities(importedActivities);
            loadActivities();
            loadHistoryDates();
            if (selectedHistoryDate) {
                displayHistoryReport(selectedHistoryDate);
            }
            showToast('Backup restored into history', 'success');
        } catch (error) {
            showToast('Could not read JSON backup', 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function isValidActivityStore(activitiesByDate) {
    if (!activitiesByDate || Array.isArray(activitiesByDate) || typeof activitiesByDate !== 'object') {
        return false;
    }

    return Object.entries(activitiesByDate).every(([date, activities]) => {
        return /^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(activities) && activities.every(activity => {
            return activity
                && typeof activity.id !== 'undefined'
                && activity.date === date
                && typeof activity.startTime === 'string'
                && typeof activity.endTime === 'string'
                && ['training', 'meeting', 'deployment'].includes(activity.type)
                && typeof activity.description === 'string';
        });
    });
}

function mergeActivities(importedActivities) {
    const allActivities = getAllActivities();

    Object.entries(importedActivities).forEach(([date, activities]) => {
        const existingActivities = allActivities[date] || [];
        const existingIds = new Set(existingActivities.map(activity => String(activity.id)));
        const newActivities = activities.filter(activity => !existingIds.has(String(activity.id)));

        allActivities[date] = existingActivities.concat(newActivities)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allActivities));
}

function switchTab(tab, button) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));

    document.getElementById(tab + 'Tab').classList.add('active');
    button.classList.add('active');

    if (tab === 'history') {
        loadHistoryDates();
    }
}

function addActivity() {
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const activityType = document.getElementById('activityType').value;
    const description = document.getElementById('description').value.trim();

    const errorEl = document.getElementById('formError');
    errorEl.classList.remove('show');

    if (!startTime || !endTime || !activityType || !description) {
        showToast('All fields are required', 'error');
        return;
    }

    if (startTime >= endTime) {
        showToast('End time must be after start time', 'error');
        return;
    }

    const activities = getActivities(date);
    if (hasTimeConflict(startTime, endTime, activities)) {
        showToast('This time slot conflicts with an existing activity', 'error');
        return;
    }

    const activity = {
        id: Date.now(),
        date,
        startTime,
        endTime,
        type: activityType,
        description
    };

    activities.push(activity);
    saveActivities(date, activities);

    document.getElementById('entryForm').reset();
    document.getElementById('date').valueAsDate = new Date();

    showToast('Activity added successfully!', 'success');
    initializeTime(); // re-initialize time to current time
    loadActivities();
    loadHistoryDates();
}

function openEditModal(id, date) {
    editingActivityId = id;
    editingActivityDate = date;
    
    const activities = getActivities(date);
    const activity = activities.find(a => a.id === id);
    
    if (activity) {
        document.getElementById('editDate').value = activity.date;
        document.getElementById('editStartTime').value = activity.startTime;
        document.getElementById('editEndTime').value = activity.endTime;
        document.getElementById('editActivityType').value = activity.type;
        document.getElementById('editDescription').value = activity.description;
        document.getElementById('editModal').classList.add('show');
    }
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    editingActivityId = null;
    editingActivityDate = null;
    document.getElementById('editError').classList.remove('show');
}

/* ==========================================================
   SETTINGS MODAL
========================================================== */

function openSettingsModal() {

    loadSettingsIntoForm();

    document
        .getElementById('settingsModal')
        .classList
        .add('show');

}

function closeSettingsModal() {

    document
        .getElementById('settingsModal')
        .classList
        .remove('show');

}

function loadSettingsIntoForm() {

    const settings = getSettings();

    document.getElementById('formsUrl').value = settings.formsUrl;
    document.getElementById('employeeId').value = settings.employeeId;
    document.getElementById('attendanceStatus').value = settings.attendanceStatus;

    document.getElementById('starRating6').value = settings.starRating6;
    document.getElementById('starRating7').value = settings.starRating7;

    document.getElementById('defaultText8').value = settings.defaultText8;
    document.getElementById('defaultText9').value = settings.defaultText9;

    document.getElementById('automationEnabled').checked = settings.automationEnabled;
    document.getElementById('autoBackup').checked = settings.autoBackup;
    document.getElementById('autoOpenForm').checked = settings.autoOpenForm;

}

function saveSettingsFromForm() {

    const settings = getSettings();

    settings.formsUrl = document.getElementById('formsUrl').value.trim();

    settings.employeeId = document.getElementById('employeeId').value.trim();

    settings.attendanceStatus = document.getElementById('attendanceStatus').value;

    settings.starRating6 = Number(
        document.getElementById('starRating6').value
    );

    settings.starRating7 = Number(
        document.getElementById('starRating7').value
    );

    settings.defaultText8 =
        document.getElementById('defaultText8').value.trim();

    settings.defaultText9 =
        document.getElementById('defaultText9').value.trim();

    settings.automationEnabled =
        document.getElementById('automationEnabled').checked;

    settings.autoBackup =
        document.getElementById('autoBackup').checked;

    settings.autoOpenForm =
        document.getElementById('autoOpenForm').checked;

    saveSettings(settings);
    updateAutomationStatus();

    closeSettingsModal();

    showToast(
        'Settings saved successfully!',
        'success'
    );

}

function saveEditedActivity() {
    const newDate = document.getElementById('editDate').value;
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;
    const activityType = document.getElementById('editActivityType').value;
    const description = document.getElementById('editDescription').value.trim();

    const errorEl = document.getElementById('editError');
    errorEl.classList.remove('show');

    if (!startTime || !endTime || !activityType || !description) {
        showToast('All fields are required', 'error');
        return;
    }

    if (startTime >= endTime) {
        showToast('End time must be after start time', 'error');
        return;
    }

    const activities = getActivities(newDate);
    const otherActivities = activities.filter(a => a.id !== editingActivityId);
    if (hasTimeConflict(startTime, endTime, otherActivities)) {
        showToast('This time slot conflicts with an existing activity', 'error');
        return;
    }

    // If date changed, remove from old date
    if (newDate !== editingActivityDate) {
        const oldActivities = getActivities(editingActivityDate);
        const filtered = oldActivities.filter(a => a.id !== editingActivityId);
        saveActivities(editingActivityDate, filtered);
    }

    // Update or add to new date
    const updated = activities.filter(a => a.id !== editingActivityId);
    updated.push({
        id: editingActivityId,
        date: newDate,
        startTime,
        endTime,
        type: activityType,
        description
    });
    saveActivities(newDate, updated);

    closeEditModal();
    showToast('Activity updated successfully!', 'success');
    loadActivities();
    loadHistoryDates();
}

function hasTimeConflict(startTime, endTime, activities) {
    return activities.some(activity => {
        return (startTime < activity.endTime && endTime > activity.startTime);
    });
}

function saveActivities(date, activities) {
    const allActivities = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    allActivities[date] = activities;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allActivities));
}

function getActivities(date) {
    const allActivities = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return allActivities[date] || [];
}

function getAllDates() {
    const allActivities = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Object.keys(allActivities).sort().reverse();
}

function loadActivities() {
    const date = document.getElementById('date').value || today;
    const activities = getActivities(date);

    const entriesList = document.getElementById('entriesList');
    
    if (activities.length === 0) {
        entriesList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No activities yet. Add your first activity!</p>';
    } else {
        activities.sort((a, b) => a.startTime.localeCompare(b.startTime));
        entriesList.innerHTML = activities.map(activity => `
            <div class="entry-item ${activity.type}">
                <div class="entry-content">
                    <div class="entry-time">
                        ${formatTime(activity.startTime)} – ${formatTime(activity.endTime)}
                        <span class="entry-type ${activity.type}">${activity.type}</span>
                    </div>
                    <div class="entry-description">${escapeHtml(activity.description)}</div>
                </div>
                <div class="entry-actions">
                    <button class="edit-btn" onclick="openEditModal(${activity.id}, '${date}')"> Edit</button>
                    <button class="delete-btn" onclick="deleteActivity(${activity.id}, '${date}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateStats(activities);
}

function loadHistoryDates() {
    const dateList = document.getElementById('dateList');
    const allDates = getAllDates();

    if (allDates.length === 0) {
        dateList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No EOD reports recorded yet.</p>';
    } else {
        dateList.innerHTML = allDates.map(date => {
            const activities = getActivities(date);
            const counts = {
                training: activities.filter(a => a.type === 'training').length,
                meeting: activities.filter(a => a.type === 'meeting').length,
                deployment: activities.filter(a => a.type === 'deployment').length
            };
            return `
                <div class="date-item ${selectedHistoryDate === date ? 'active' : ''}" onclick="selectHistoryDate('${date}')">
                    <div class="date-label">${formatDateDisplay(date)}</div>
                    <div class="date-summary">${counts.training}T • ${counts.meeting}M • ${counts.deployment}D</div>
                </div>
            `;
        }).join('');
    }
}

function selectHistoryDate(date) {
    selectedHistoryDate = date;
    loadHistoryDates();
    displayHistoryReport(date);
}

function displayHistoryReport(date) {
    const reportDisplay = document.getElementById('reportDisplay');
    const activities = getActivities(date);

    if (activities.length === 0) {
        reportDisplay.classList.add('empty');
        reportDisplay.textContent = 'No activities recorded for this date.';
    } else {
        reportDisplay.classList.remove('empty');
        activities.sort((a, b) => a.startTime.localeCompare(b.startTime));

        let report = `EOD REPORT - ${formatDateDisplay(date)}\n`;
        report += '='.repeat(50) + '\n\n';

        activities.forEach(activity => {
            const type = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
            report += `${formatTime(activity.startTime)} – ${formatTime(activity.endTime)} | ${type}: ${activity.description}\n`;
        });

        reportDisplay.textContent = report;
    }
}

function deleteActivity(id, date) {
    if (confirm('Are you sure you want to delete this activity?')) {
        const activities = getActivities(date);
        const filtered = activities.filter(a => a.id !== id);
        saveActivities(date, filtered);
        showToast('Activity deleted', 'info');
        loadActivities();
        loadHistoryDates();
        updateAutomationStatus();
    }
}

function updateStats(activities) {
    const counts = {
        training: activities.filter(a => a.type === 'training').length,
        meeting: activities.filter(a => a.type === 'meeting').length,
        deployment: activities.filter(a => a.type === 'deployment').length
    };

    document.getElementById('trainingCount').textContent = counts.training;
    document.getElementById('meetingCount').textContent = counts.meeting;
    document.getElementById('deploymentCount').textContent = counts.deployment;
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateReport(date) {
    const activities = getActivities(date);

    if (activities.length === 0) {
        return 'No activities recorded for this date.';
    }

    activities.sort((a, b) => a.startTime.localeCompare(b.startTime));

    let report = `EOD REPORT - ${formatDateDisplay(date)}\n`;
    report += '='.repeat(50) + '\n\n';

    activities.forEach(activity => {
        const type = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
        report += `${formatTime(activity.startTime)} – ${formatTime(activity.endTime)} | ${type}: ${activity.description}\n`;
    });

    return report;
}

function exportToText() {
    const date = document.getElementById('date').value;
    const report = generateReport(date);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', `EOD_Report_${date}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Report exported!', 'success');
}

function copyToClipboard() {
    const date = document.getElementById('date').value;
    const report = generateReport(date);
    navigator.clipboard.writeText(report).then(() => {
        showToast('Report copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy report', 'error');
    });
}

function exportSelectedReport() {
    if (!selectedHistoryDate) {
        showToast('Please select a date first', 'error');
        return;
    }
    const report = generateReport(selectedHistoryDate);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', `EOD_Report_${selectedHistoryDate}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Report exported!', 'success');
}

function copySelectedReport() {
    if (!selectedHistoryDate) {
        showToast('Please select a date first', 'error');
        return;
    }
    const report = generateReport(selectedHistoryDate);
    navigator.clipboard.writeText(report).then(() => {
        showToast('Report copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy report', 'error');
    });
}

document.getElementById('date').addEventListener('change', loadActivities);

// Close modal when clicking outside
window.onclick = function (event) {

    if (event.target === document.getElementById('editModal')) {

        closeEditModal();

    }

    if (event.target === document.getElementById('backupModal')) {

        closeBackupModal();

    }

    if (event.target === document.getElementById('settingsModal')) {

        closeSettingsModal();

    }

};

function updateHeaderDate() {
    const headerDate = document.getElementById('headerDate');
    if (!headerDate) return;

    headerDate.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

updateHeaderDate();
updateAutomationStatus();

function updateThemeButton() {
    const btn = document.querySelector('.theme-toggle');
    const isLight = document.body.classList.contains('light-mode');
    btn.innerHTML = isLight ? '&#x2600;&#xFE0F;' : '&#x1F319;';
}

function validateAutomationSettings() {

    const settings = getSettings();

    const missing = [];

    if (!settings.formsUrl)
        missing.push('Microsoft Forms URL');

    if (!settings.employeeId)
        missing.push('Employee ID');

    if (!settings.attendanceStatus)
        missing.push('Attendance Status');

    if (!settings.starRating6)
        missing.push('Default Rating #1');

    if (!settings.starRating7)
        missing.push('Default Rating #2');

    if (!settings.defaultText8)
        missing.push('Default Answer #8');

    if (!settings.defaultText9)
        missing.push('Default Answer #9');

    return {

        valid: missing.length === 0,

        missing

    };

}

function updateAutomationStatus() {

    const badge = document.getElementById('automationStatus');

    if (!badge) return;

    const validation = validateAutomationSettings();

    if (!validation.valid) {

        badge.className = 'automation-status warning';

        badge.textContent = '🟡 Setup Required';

        return;

    }

    const todayActivities = getActivities(getTodayDateValue());

    if (todayActivities.length === 0) {

        badge.className = 'automation-status error';

        badge.textContent = '🔴 No Activities';

        return;

    }

    badge.className = 'automation-status ready';

    badge.textContent = '🟢 Ready to Submit';

}


document.querySelectorAll('.tab-button').forEach(function(button) {

    button.addEventListener('click', function() {

        switchTab(button.dataset.tab, button);

    });

});

document.addEventListener('keydown', function (event) {

    if (event.key !== 'Escape') return;

    closeEditModal();
    closeBackupModal();

    if (menuToggle && headerControls) {

        menuToggle.classList.remove('active');
        headerControls.classList.remove('show');
        menuToggle.setAttribute('aria-expanded', 'false');

    }

});
