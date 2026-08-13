const STORAGE_KEY = 'eodActivities';
const THEME_KEY = 'eodTheme';
const today = getTodayDateValue();
const SETTINGS_KEY = 'eodSettings';
const APP_VIEW_KEY = 'eodActiveView';
const REPORT_TAB_KEY = 'eodActiveReportTab';
let tampermonkeyDetected = false;
let selectedHistoryDate = null;
let editingActivityId = null;
let editingActivityDate = null;

const SETUP_KEYS = {
    tampermonkey: 'setup_tampermonkey',
    script: 'setup_script',
    verified: 'setup_verified',
    configured: 'setup_configured',
    tested: 'setup_tested',
    version: 'automation_version',
    lastVerified: 'automation_last_verified',
    lastSuccess: 'automation_last_successful'
};

const PENDING_SETUP_KEYS = {
    tampermonkey: 'pending_setup_tampermonkey',
    script: 'pending_setup_script'
};

const SETUP_CHECKBOX_KEYS = {
    setupTampermonkeyCheckbox: 'tampermonkey',
    setupScriptCheckbox: 'script',
    setupConfiguredCheckbox: 'configured',
    setupTestedCheckbox: 'tested'
};

const TAMPERMONKEY_INSTALL_URL = 'https://tampermonkey.net/?ext=dhdg&browser=chrome';
const AUTOMATION_SCRIPT_URL = 'EODAuto-Forms-Automation.user.js';
const AUTOMATION_TEST_PAGE = 'EODAuto-Test.html';

const DEFAULT_SETTINGS = {
    version: 1,
    automationEnabled: true,
    autoBackup: true,
    autoOpenForm: true,
    formsUrl: 'https://forms.cloud.microsoft/pages/responsepage.aspx?id=VC0K9rQDFEWyn1uxr3fPC2pICO7P_hdMkKpJ5I4OTyFUNzVSOUZNSDVNNU5UUUVXSjMwOTE3OVdNNy4u&origin=lprLink&route=shorturl',
    employeeId: '',
    attendanceStatus: 'Present – Training (Bootcamp)',
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

// Initializion
initializeTheme();
initializeTime(); 


// Load activities on page load
loadActivities();
loadHistoryDates();
loadSettingsIntoForm();

// Global error handler to surface runtime issues during initialization
window.addEventListener('error', function (ev) {
    try {
        const msg = ev && ev.message ? ev.message : String(ev);
        console.error('Uncaught error:', ev.error || ev);
        const container = document.getElementById('toastContainer');
        if (container) {
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.innerHTML = `<span class="toast-icon">✕</span><span class="toast-message">Initialization error: ${msg}</span><button class="toast-close">×</button>`;
            container.appendChild(toast);
            toast.querySelector('.toast-close').addEventListener('click', function () { toast.remove(); });
        } else {
            alert('Initialization error: ' + msg);
        }
    } catch (e) {
        console.error('Error handler failure', e);
    }
});

// Ensure event bindings run after DOM is ready; re-attach safely if something failed earlier
document.addEventListener('DOMContentLoaded', function () {
    try {
        const safeOn = (selectorOrEl, event, handler) => {
            const el = typeof selectorOrEl === 'string' ? document.getElementById(selectorOrEl) : selectorOrEl;
            if (!el) return;
            el.addEventListener(event, handler);
        };

        safeOn('formsBtn', 'click', openForms);
        safeOn('backupBtn', 'click', openBackupModal);
        safeOn('restoreBtn', 'click', function () { const el = document.getElementById('restoreInput'); if (el) el.click(); });
        safeOn('runAutomationTestBtn', 'click', runAutomationTest);
        safeOn('confirmTestCompletedBtn', 'click', markAutomationTestCompleted);
        safeOn('saveSettingsBtn', 'click', function (event) { event.preventDefault(); event.stopImmediatePropagation(); if (saveSettingsFromForm()) showToast('Settings saved successfully!', 'success'); });
        safeOn('restoreInput', 'change', restoreActivitiesFromJson);
        safeOn('themeToggle', 'click', toggleTheme);
        safeOn('exportTextBtn', 'click', exportToText);
        safeOn('copyReportBtn', 'click', copyToClipboard);
        safeOn('exportHistoryBtn', 'click', exportSelectedReport);
        safeOn('copyHistoryBtn', 'click', copySelectedReport);
        safeOn('cancelEditBtn', 'click', closeEditModal);
        safeOn('cancelBackupBtn', 'click', closeBackupModal);
        safeOn('confirmBackupBtn', 'click', downloadSelectedBackup);
        safeOn('backupSelectAll', 'change', toggleSelectAllBackups);
        safeOn('submitEodBtn', 'click', submitTodayEOD);

        // checkboxes: bind change handlers safely
        Object.keys(SETUP_CHECKBOX_KEYS).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', function (event) {
                const key = SETUP_CHECKBOX_KEYS[id];
                setSetupState(key, event.target.checked);
            });
            // keep click fallback too
            el.addEventListener('click', function () {
                setTimeout(() => setSetupState(SETUP_CHECKBOX_KEYS[id], el.checked), 0);
            });
        });

        // re-run UI updates
        updateSetupWizardUI();
        updateAutomationStatusCard();
        updateSubmitButtonState();
        updateAutomationStatus();
        enableAccordionAutoClose();
    } catch (e) {
        console.error('Error in DOMContentLoaded init:', e);
        showToast && showToast('Initialization failed: ' + (e.message || e), 'error', 5000);
    }
});


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

document.getElementById('runAutomationTestBtn')
    ?.addEventListener('click', runAutomationTest);

document.getElementById('confirmTestCompletedBtn')
    ?.addEventListener('click', markAutomationTestCompleted);

document.getElementById('saveSettingsBtn')?.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (saveSettingsFromForm()) {
        showToast('Settings saved successfully!', 'success');
    }
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
document.getElementById('setupTampermonkeyCheckbox')
    ?.addEventListener('change', function (event) {
        setSetupState('tampermonkey', event.target.checked);
        if (!event.target.checked) {
            setPendingSetup('tampermonkey', false);
        }
    });

document.getElementById('setupScriptCheckbox')
    ?.addEventListener('change', function (event) {
        setSetupState('script', event.target.checked);
        if (!event.target.checked) {
            setPendingSetup('script', false);
        }
    });

document.getElementById('setupConfiguredCheckbox')
    ?.addEventListener('change', function (event) {
        setSetupState('configured', event.target.checked);
    });

document.getElementById('setupTestedCheckbox')
    ?.addEventListener('change', function (event) {
        setSetupState('tested', event.target.checked);
    });

// Fallback click handlers: ensure immediate UI sync when users click checkboxes
// (some browsers/devices may fire click before change; use timeout to read final state)
document.getElementById('setupTampermonkeyCheckbox')?.addEventListener('click', function (e) {
    const cb = this;
    setTimeout(() => setSetupState('tampermonkey', cb.checked), 0);
});

document.getElementById('setupScriptCheckbox')?.addEventListener('click', function (e) {
    const cb = this;
    setTimeout(() => setSetupState('script', cb.checked), 0);
});

document.getElementById('setupConfiguredCheckbox')?.addEventListener('click', function (e) {
    const cb = this;
    setTimeout(() => setSetupState('configured', cb.checked), 0);
});

document.getElementById('setupTestedCheckbox')?.addEventListener('click', function (e) {
    const cb = this;
    setTimeout(() => setSetupState('tested', cb.checked), 0);
});

window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'eodauto-verification') return;

    if (event.data.verified) {
        setAutomationMeta('version', event.data.version || '2.0');
        setAutomationMeta('lastVerified', new Date().toISOString());
        showToast('Automation verified successfully!', 'success');
    }
});

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

function getSetupState(key) {
    return localStorage.getItem(SETUP_KEYS[key]) === 'true';
}

function setSetupState(key, value) {
    localStorage.setItem(SETUP_KEYS[key], value ? 'true' : 'false');
    updateSetupWizardUI();
    updateAutomationStatusCard();
    updateSubmitButtonState();
}

function getAutomationMeta(key) {
    return localStorage.getItem(SETUP_KEYS[key]) || 'Never';
}

function setAutomationMeta(key, value) {
    if (value == null) {
        localStorage.removeItem(SETUP_KEYS[key]);
    } else {
        localStorage.setItem(SETUP_KEYS[key], value);
    }
    updateAutomationStatusCard();
}

function getPendingSetup(key) {
    return localStorage.getItem(PENDING_SETUP_KEYS[key]) === 'true';
}

function setPendingSetup(key, value) {
    localStorage.setItem(PENDING_SETUP_KEYS[key], value ? 'true' : 'false');
}

function handleTampermonkeyInstall() {
    if (getSetupState('tampermonkey')) {
        setSetupState('tampermonkey', false);
        setPendingSetup('tampermonkey', false);
        showToast('Tampermonkey step reset.', 'info');
        return;
    }

    window.open(TAMPERMONKEY_INSTALL_URL, '_blank');
    setPendingSetup('tampermonkey', true);
    showToast('Tampermonkey install page opened. Click again once installed.', 'info');
}

function handleAutomationScriptInstall() {
    if (getSetupState('script')) {
        setSetupState('script', false);
        setPendingSetup('script', false);
        showToast('Automation script step reset.', 'info');
        return;
    }

    window.open(AUTOMATION_SCRIPT_URL, '_blank');
    setPendingSetup('script', true);
    showToast('Automation script opened for installation. Click again once installed.', 'info');
}

function toggleVerificationStep() {
    scrollToAutomationSettings();
}

function toggleConfiguredStep() {
    scrollToAutomationSettings();
}

function verifyAutomationInstallation() {
    const settings = getSettings();

    if (!settings.formsUrl) {
        showToast('Please configure the form URL first.', 'error');
        scrollToAutomationSettings();
        return;
    }

    const url = `${settings.formsUrl}#eodauto=${encodeURIComponent(JSON.stringify({ verify: true }))}`;
    window.open(url, '_blank');
    showToast('Verification page opened. The userscript will report back automatically.', 'info');
}

function runAutomationTest() {
    const validation = validateAutomationSettings();

    if (!validation.valid) {
        showToast('Complete automation configuration before running a test.', 'error');
        scrollToAutomationSettings();
        return;
    }

    const settings = getSettings();
    const payload = {
        testMode: true,
        empId: settings.employeeId,
        attendanceStatus: settings.attendanceStatus,
        date: formatFormsDate(getTodayDateValue()),
        report: 'EODAuto test report',
        starRating6: settings.starRating6,
        starRating7: settings.starRating7,
        defaultText8: settings.defaultText8 || 'Test answer 8',
        defaultText9: settings.defaultText9 || 'Test answer 9'
    };

    const url = `${AUTOMATION_TEST_PAGE}#eodauto=${encodeURIComponent(JSON.stringify({
        verify: true,
        testMode: true,
        empId: settings.employeeId,
        attendanceStatus: settings.attendanceStatus,
        date: formatFormsDate(getTodayDateValue()),
        report: 'EODAuto test report',
        starRating6: settings.starRating6,
        starRating7: settings.starRating7,
        defaultText8: settings.defaultText8 || 'Test answer 8',
        defaultText9: settings.defaultText9 || 'Test answer 9'
    }))}`;
    window.open(url, '_blank');
    showToast('Automation test launched. Confirm when Mission Control appears.', 'info');
    document.getElementById('confirmTestCompletedBtn')?.classList.remove('hidden');
}

function markAutomationTestCompleted() {
    setSetupState('tested', true);
    setAutomationMeta('lastSuccess', new Date().toISOString());
    document.getElementById('confirmTestCompletedBtn')?.classList.add('hidden');
    updateSubmitButtonState();
    showToast('Automation test confirmed successfully.', 'success');
}

function updateSetupWizardUI() {
    // Helper: ensure completed state visibly applies to details and summary
    function applyCompletedStyle(stepEl, isComplete) {
        if (!stepEl) return;
        const summary = stepEl.querySelector('.wizard-step-summary');
        if (isComplete) {
            stepEl.classList.add('completed');
            if (summary) summary.classList.add('completed');
            // also apply inline style as a fallback for theming/priority issues
            stepEl.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--success') || '#50fa7b';
            stepEl.style.background = 'rgba(80,250,123,.08)';
            stepEl.style.boxShadow = '0 0 0 2px rgba(80,250,123,0.18)';
        } else {
            stepEl.classList.remove('completed');
            if (summary) summary.classList.remove('completed');
            stepEl.style.borderColor = '';
            stepEl.style.background = '';
            stepEl.style.boxShadow = '';
        }
    }
    const tamperStep = document.getElementById('wizardStepTampermonkey');
    const tamperCheckbox = document.getElementById('setupTampermonkeyCheckbox');
    const tamperComplete = getSetupState('tampermonkey');
    applyCompletedStyle(tamperStep, tamperComplete);
    if (tamperCheckbox) tamperCheckbox.checked = !!tamperComplete;

    const scriptStep = document.getElementById('wizardStepScript');
    const scriptCheckbox = document.getElementById('setupScriptCheckbox');
    const scriptComplete = getSetupState('script');
    applyCompletedStyle(scriptStep, scriptComplete);
    if (scriptCheckbox) scriptCheckbox.checked = !!scriptComplete;

    const configureStep = document.getElementById('wizardStepConfigure');
    const configureCheckbox = document.getElementById('setupConfiguredCheckbox');
    const configureComplete = validateAutomationSettings().valid || getSetupState('configured');

    applyCompletedStyle(configureStep, configureComplete);
    if (configureCheckbox) configureCheckbox.checked = !!configureComplete;

    const testStep = document.getElementById('wizardStepTest');
    const testCheckbox = document.getElementById('setupTestedCheckbox');
    const testComplete = getSetupState('tested');
    applyCompletedStyle(testStep, testComplete);
    if (testCheckbox) testCheckbox.checked = !!testComplete;

    updateSubmitButtonState();
}

function updateAutomationStatusCard() {
    const lastVerifiedEl = document.getElementById('statusLastVerified');
    const lastSuccessEl = document.getElementById('statusLastSuccess');
    const readyEl = document.getElementById('statusReady');

    if (lastVerifiedEl) {
        lastVerifiedEl.textContent = formatFriendlyDate(getAutomationMeta('lastVerified'));
    }
    if (lastSuccessEl) {
        lastSuccessEl.textContent = formatFriendlyDate(getAutomationMeta('lastSuccess'));
    }

    const ready = isAutomationSetupComplete();
    if (readyEl) {
        readyEl.textContent = ready ? '🟢 Ready' : '🔴 Not Ready';
    }
}

function isAutomationSetupComplete() {
    return getSetupState('tampermonkey') &&
           getSetupState('script') &&
           (validateAutomationSettings().valid || getSetupState('configured')) &&
           getSetupState('tested');
}

function getAutomationSetupProgress() {
    const steps = [
        getSetupState('tampermonkey'),
        getSetupState('script'),
        validateAutomationSettings().valid || getSetupState('configured'),
        getSetupState('tested')
    ];

    const completed = steps.filter(Boolean).length;

    return {
        completed,
        total: steps.length,
        percent: Math.round((completed / steps.length) * 100)
    };
}

function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitEodBtn');
    const reminder = document.getElementById('automationSetupReminder');
    const complete = isAutomationSetupComplete();
    const progress = getAutomationSetupProgress();

    if (submitBtn) {
        submitBtn.disabled = !complete;
    }

    if (reminder) {
        reminder.classList.toggle('setup-ready', complete);
        reminder.classList.toggle('setup-incomplete', !complete);
        reminder.classList.toggle('setup-complete', complete);
        reminder.innerHTML = `
            <div class="setup-status-icon" aria-hidden="true">${complete ? 'OK' : '!'}</div>
            <div class="setup-status-body">
                <div class="setup-status-title">
                    ${complete ? 'Automation ready' : 'Automation setup incomplete'}
                </div>
                <div class="setup-status-copy">
                    ${complete
                        ? "Ready to submit today's EOD."
                        : `Complete ${progress.completed} of ${progress.total} setup steps before submitting.`}
                </div>
                <div class="setup-progress" aria-hidden="true">
                    <span style="width:${progress.percent}%"></span>
                </div>
            </div>
        `;
    }
}

function formatFriendlyDate(value) {
    if (!value || value === 'Never') return 'Never';
    const date = new Date(value);
    if (isNaN(date)) return value;
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
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

        scrollToAutomationSettings();

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

    if (!isAutomationSetupComplete()) {
        showToast('Complete the automation setup before submitting today.', 'error');
        switchAppView('automation');
        document.querySelector('.automation-wizard-card')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        return;
    }

    const settings = getSettings();

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

    const tabContent = document.getElementById(tab + 'Tab');
    const tabButton = button || document.querySelector(`.tab-button[data-tab="${tab}"]`);

    if (!tabContent || !tabButton) return;

    tabContent.classList.add('active');
    tabButton.classList.add('active');
    localStorage.setItem(REPORT_TAB_KEY, tab);

    if (tab === 'history') {
        loadHistoryDates();
    }
}

function switchAppView(view) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.dataset.view = view;
    localStorage.setItem(APP_VIEW_KEY, view);

    document.querySelectorAll('.app-view-button').forEach(button => {
        button.classList.toggle('active', button.dataset.view === view);
    });

    if (view === 'automation') {
        loadSettingsIntoForm();
        updateSetupWizardUI();
    }
}

function restoreWorkspaceState() {
    const savedView = localStorage.getItem(APP_VIEW_KEY);
    const savedTab = localStorage.getItem(REPORT_TAB_KEY);

    if (savedView === 'daily' || savedView === 'automation') {
        switchAppView(savedView);
    }

    if (savedTab === 'today' || savedTab === 'history') {
        switchTab(savedTab);
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

function loadSettingsIntoForm() {

    const settings = getSettings();

    document.getElementById('formsUrl').value = settings.formsUrl;
    document.getElementById('employeeId').value = settings.employeeId;
    const attendanceSelect = document.getElementById('attendanceStatus');
    if (attendanceSelect && Array.from(attendanceSelect.options).some(opt => opt.value === settings.attendanceStatus)) {
        attendanceSelect.value = settings.attendanceStatus;
    } else if (attendanceSelect) {
        attendanceSelect.selectedIndex = 0;
    }

    document.getElementById('starRating6').value = settings.starRating6;
    document.getElementById('starRating7').value = settings.starRating7;

    document.getElementById('defaultText8').value = settings.defaultText8;
    document.getElementById('defaultText9').value = settings.defaultText9;

    document.getElementById('autoBackup').checked = settings.autoBackup;

    // Keep the configure step synced with the current saved settings.
    setSetupState('configured', validateAutomationSettings().valid);

}

function saveSettingsFromForm() {
    const form = document.getElementById('settingsForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    const settings = getSettings();

    settings.formsUrl = document.getElementById('formsUrl').value.trim();
    settings.employeeId = document.getElementById('employeeId').value.trim();
    settings.attendanceStatus = document.getElementById('attendanceStatus').value;
    settings.starRating6 = Number(document.getElementById('starRating6').value);
    settings.starRating7 = Number(document.getElementById('starRating7').value);
    settings.defaultText8 = document.getElementById('defaultText8').value.trim();
    settings.defaultText9 = document.getElementById('defaultText9').value.trim();
    settings.autoBackup = document.getElementById('autoBackup').checked;

    saveSettings(settings);

    if (validateAutomationSettings().valid) {
        setSetupState('configured', true);
    } else {
        setSetupState('configured', false);
    }

    loadSettingsIntoForm();
    updateAutomationStatus();
    updateSubmitButtonState();

    return true;
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
updateSetupWizardUI();
updateAutomationStatusCard();
updateSubmitButtonState();
updateAutomationStatus();

// Accordion: auto-close previously opened wizard panels when a new one opens
function enableAccordionAutoClose() {
    const panels = Array.from(document.querySelectorAll('details.wizard-step'));
    if (!panels || panels.length === 0) return;
    panels.forEach(panel => {
        panel.addEventListener('toggle', function () {
            if (this.open) {
                panels.forEach(other => {
                    if (other !== this) other.removeAttribute('open');
                });
            }
        });
    });
}

enableAccordionAutoClose();

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

document.querySelectorAll('.app-view-button').forEach(function(button) {

    button.addEventListener('click', function() {

        switchAppView(button.dataset.view);

    });

});

restoreWorkspaceState();

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
