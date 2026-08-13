// ==UserScript==
// @name         EODAuto Forms Automation
// @namespace    https://github.com/
// @version      2.0
// @description  Automatically fills Microsoft Forms from EODAuto and validates setup via a local test page.
// @author       You
// @match        *://forms.cloud.microsoft/*
// @match        *://forms.office.com/*
// @match        *://*/*EODAuto-Test.html
// @match        file:///*EODAuto-Test.html
// @match        *://127.0.0.1:5500/*EODAuto-Test.html
// @match        *://localhost:5500/*EODAuto-Test.html
// @grant        none
// ==/UserScript==

(function () {

    'use strict';

    /* ==========================================================
       CONFIG
    ========================================================== */

    const POLL_INTERVAL = 500;

    const FORM_MAPPING = {

        employeeId: 'Employee ID',

        attendanceStatus: 'Attendance',

        date: 'Date',

        report: "Please record the tasks you completed today",

        rating1: 'Rating',

        rating2: 'Rating',

        answer8: 'Question 8',

        answer9: 'Question 9'

    };

    const TEST_PAGE_TITLE = 'EODAuto Test Page';
    const TEST_PAGE_BODY = 'This is the EODAuto setup validation page.';

    function isTestPage() {
        return /EODAuto-Test\.html$/i.test(location.pathname) || /EODAuto-Test\.html/i.test(location.href);
    }

    /* ==========================================================
    COMMAND CENTER
    ========================================================== */

    let overlay;
    let statusText;
    let progressText;
    let progressFill;
    let elapsedText;
    let logContainer;

    let logCount = 0;
    let startTime = 0;

    let timerInterval = null;

 function initializeOverlay() {

    startTime = Date.now();

    overlay = document.createElement('div');

    overlay.id = 'eodauto-overlay';

    overlay.innerHTML = `
        <div class="eod-header">

            <span class="eod-title">

                EODAuto Mission Control

            </span>

            <div class="header-actions">

                <span class="eod-version">

                    v2.0

                </span>

                <button
                    id="eod-close"
                    class="eod-close"
                    title="Close Mission Control">

                    ✕

                </button>

            </div>

        </div>

        <div class="eod-body">

            <div class="status-row">

                <span>Status</span>

                <strong id="eod-status">

                    Initializing...

                </strong>

            </div>

            <div class="status-row">

                <span>Progress</span>

                <span id="eod-progress-text">

                    0 / 0

                </span>

            </div>

            <div class="progress">

                <div
                    id="eod-progress-fill"
                    class="progress-fill">

                </div>

            </div>

            <div class="status-row">

                <span>Elapsed</span>

                <span id="eod-elapsed">

                    0.0 s

                </span>

            </div>

            <div class="console-title">

                SYSTEM LOG

            </div>

            <div
                id="eod-console"
                class="console">

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    statusText = document.getElementById('eod-status');

    progressText = document.getElementById('eod-progress-text');

    progressFill = document.getElementById('eod-progress-fill');

    elapsedText = document.getElementById('eod-elapsed');

    logContainer = document.getElementById('eod-console');

    document
        .getElementById('eod-close')
        .addEventListener(
            'click',
            closeOverlay
        );

}

function setStatus(text, color="#50fa7b"){

    statusText.textContent = text;

    statusText.style.color = color;

}

function setProgress(current, total) {

    progressText.textContent =
        `${current} / ${total}`;

    const percent =
        total === 0 ? 0 : (current / total) * 100;

    progressFill.style.width = `${percent}%`;

    if (current === total) {

        log("DONE", "Automation completed.");

    }

}

function nextStep(step, total, status) {

    setProgress(step, total);

    setStatus(
        status,
        "#8be9fd"
    );

    log(
        "ACTION",
        status
    );

}

function logError(message) {

    log(
        "ERROR",
        message
    );

    setStatus("Automation Interrupted");
}

function logSuccess(message) {

    log(
        "SUCCESS",
        message
    );

}

function logManual(message) {

    log(
        "MANUAL",
        message
    );

}

function log(type, message) {

    logCount++;

    const line = document.createElement('div');

    line.className =
        `console-line log-${type.toLowerCase()}`;

    line.innerHTML = `
        <span class="log-tag">
            [${type.toUpperCase()}]
        </span>

        <span class="log-message">
            ${message}
        </span>
    `;

    logContainer.appendChild(line);

    logContainer.scrollTop =
        logContainer.scrollHeight;

}
function startTimer() {

    if (timerInterval) {

        clearInterval(timerInterval);

    }

    timerInterval = setInterval(function () {

        elapsedText.textContent =
            (
                (Date.now() - startTime) / 1000
            ).toFixed(1) + " s";

    }, 100);

}

    function stopTimer() {

    if (!timerInterval) {

        return;

    }

    clearInterval(timerInterval);

    timerInterval = null;

}

    function closeOverlay() {

    overlay.style.opacity = "0";

    overlay.style.transform =
        "translateY(15px) scale(.98)";

    setTimeout(function () {

        overlay.remove();

    }, 250);

}

    /* ==========================================================
       STARTUP
    ========================================================== */

const payload = readPayload();

if (!payload) {

    console.log('EODAuto: No payload found.');

    return;

}

injectOverlayStyles();
initializeOverlay();

if (payload.verify) {
    sendVerificationSignal();
    setStatus('Verified by automation', '#50fa7b');
    setProgress(1, 1);
    logSuccess('Verification handshake complete.');
    stopTimer();
    if (isTestPage()) {
        document.title = `${TEST_PAGE_TITLE} — Verified`;
    }
    history.replaceState({}, '', location.pathname);
    return;
}

function sendVerificationSignal() {
    if (!window.opener || typeof window.opener.postMessage !== 'function') {
        return;
    }

    window.opener.postMessage({
        type: 'eodauto-verification',
        verified: true,
        version: '2.0',
        timestamp: Date.now()
    }, '*');

    logSuccess('Verification signal sent to EODauto.');
}

/* ==========================================================
   INITIALIZE COMMAND CENTER
========================================================== */

function injectOverlayStyles() {

    const style = document.createElement('style');

    style.textContent = `

#eodauto-overlay{

    position:fixed;

    right:24px;

    bottom:24px;

    width:360px;

    background:#282a36;

    color:#f8f8f2;

    border:1px solid #44475a;

    border-radius:14px;

    overflow:hidden;

    font-family:Consolas, Monaco, monospace;

    font-size:13px;

    box-shadow:0 18px 40px rgba(0,0,0,.45);

    z-index:999999;

    backdrop-filter:blur(10px);

    animation:eodSlideIn .35s ease;

}

.eod-header{

    display:flex;

    justify-content:space-between;

    align-items:center;

    padding:12px 16px;

    background:#21222c;

    border-bottom:1px solid #44475a;

    font-weight:bold;

}

.eod-version{

    color:#8be9fd;

    font-size:12px;

}

.eod-body{

    padding:16px;

}

.status-row{

    display:flex;

    justify-content:space-between;

    margin-bottom:10px;

}

.progress{

    height:8px;

    background:#44475a;

    border-radius:999px;

    overflow:hidden;

    margin-bottom:14px;

}

.progress-fill{

    width:0%;

    height:100%;

    background:linear-gradient(
        90deg,
        #50fa7b,
        #8be9fd
    );

    transition:width .35s ease;

}

.console-title{

    margin-top:14px;

    margin-bottom:8px;

    color:#8be9fd;

    font-weight:bold;

    letter-spacing:1px;

}

.console{

    height:170px;

    overflow-y:auto;

    padding:10px;

    background:#1b1c25;

    border-radius:8px;

    border:1px solid #44475a;

}

.console-line{

    display:flex;

    gap:10px;

    margin-bottom:6px;

    word-break:break-word;

}

.log-tag{

    min-width:74px;

    font-weight:bold;

}

.log-message{

    flex:1;

}

.log-boot .log-tag{

    color:#8be9fd;

}

.log-info .log-tag{

    color:#bd93f9;

}

.log-action .log-tag{

    color:#f1fa8c;

}

.log-success .log-tag{

    color:#50fa7b;

}

.log-wait .log-tag{

    color:#ffb86c;

}

.log-manual .log-tag{

    color:#ff79c6;

}

.log-error .log-tag{

    color:#ff5555;

}

.log-done .log-tag{

    color:#50fa7b;

}

.console::-webkit-scrollbar{

    width:8px;

}

.console::-webkit-scrollbar-thumb{

    background:#44475a;

    border-radius:999px;

}

@keyframes eodSlideIn{

    from{

        transform:translateY(20px);

        opacity:0;

    }

    to{

        transform:none;

        opacity:1;

    }

}

@media(max-width:700px){

    #eodauto-overlay{

        right:12px;

        left:12px;

        bottom:12px;

        width:auto;

    }

}

`;

    document.head.appendChild(style);

}

startTimer();

log("BOOT", "Mission Control online.");

log("INFO", "Payload decoded.");

log("WAIT", "Waiting for Microsoft Forms.");

setStatus("Initializing...");

setProgress(0, 10);

console.log('EODAuto Payload:', payload);


/* ==========================================================
   PAYLOAD
========================================================== */

function readPayload() {

    if (!location.hash.startsWith('#eodauto=')) {

        return null;

    }

    try {

        return JSON.parse(

            decodeURIComponent(

                location.hash.substring(9)

            )

        );

    }

    catch (error) {

        console.error(error);

logError(
    error.message
);

        return null;

    }

}

function getQuestions() {

    return [

        ...document.querySelectorAll(

            'div[data-automation-id="questionItem"]'

        )

    ];

}

function findQuestion(text) {

    console.log("Searching for:", text);

    const questions = getQuestions();

    for (const question of questions) {

        console.log("----------------");

        console.log(question.innerText);

        console.log(
            "Match:",
            question.innerText
                .toLowerCase()
                .includes(text.toLowerCase())
        );

        if (
            question.innerText
                .toLowerCase()
                .includes(text.toLowerCase())
        ) {

            console.log("FOUND!");

            return question;

        }

    }

    console.log("NOT FOUND");

    return null;

}
function fillText(question, value) {

    console.log("Question:", question);
    console.log("Value:", value);

    if (!question) {

        console.error("Question not found");

        return false;

    }

    if (value == null) {

        console.error("Value missing");

        return false;

    }

    const input = question.querySelector(
        "textarea,input"
    );

    console.log("Input:", input);

    if (!input) {

        console.error("No input inside question");

        return false;

    }

    const setter =
        input.tagName === "TEXTAREA"
            ? Object.getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                "value"
            ).set
            : Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                "value"
            ).set;

    setter.call(input, value);

    input.dispatchEvent(
        new Event("input", {
            bubbles: true
        })
    );

    input.dispatchEvent(
        new Event("change", {
            bubbles: true
        })
    );

    console.log("Filled successfully.");

    return true;

}

function selectRadio(question, value) {

    if (!question || !value) return;

    const radios = question.querySelectorAll(
        'input[type="radio"]'
    );

    radios.forEach(radio => {

        const label = radio.closest('label');

        if (
            label &&
            label.innerText
                .trim()
                .toLowerCase()
                .includes(value.toLowerCase())
        ) {

            radio.click();

        }

    });

}

function selectRating(question, rating) {

    if (!question || !rating) return;

    const stars = question.querySelectorAll(

        '[role="radio"]'

    );

    if (

        rating < 1 ||

        rating > stars.length

    ) {

        return;

    }

    stars[rating - 1].click();

}

function clickNext() {

    const nextButton =
        document.querySelector(
            'button[data-automation-id="nextButton"]'
        );

    if (!nextButton) {

        logError(
            "Next button not found."
        );

        return;

    }

    log(
        "ACTION",
        "Navigating to next page..."
    );

    setTimeout(function () {

        nextButton.click();

    }, 300);

}

function fillPage4(payload) {

    nextStep(
        7,
        10,
        "Completing Final Questions"
    );

    const questions = getQuestions();

    if (questions.length >= 2) {

        fillText(
            questions[0],
            payload.defaultText8
        );

        logSuccess(
            "Question 8 completed."
        );

        fillText(
            questions[1],
            payload.defaultText9
        );

        logSuccess(
            "Question 9 completed."
        );

    } else {

        logError(
            "Unable to locate final questions."
        );

    }

    nextStep(
        9,
        10,
        "Awaiting Screenshot"
    );

    logManual(
        "Upload today's screenshot."
    );

    logManual(
        "Review the completed form."
    );

    logManual(
        "Click Submit when ready."
    );

    setStatus(
        "Mission Complete",
        "#50fa7b"
    );

    setProgress(
        10,
        10
    );

    log(
        "DONE",
        "Automation finished successfully."
    );

}

function clickSubmit() {

    const submitButton =

        document.querySelector(

            'button[data-automation-id="submitButton"]'

        );

    if (!submitButton) {

        return false;

    }

    setTimeout(function () {

        submitButton.click();

    }, 400);

    return true;

}

let lastQuestionNode = null;

let lastPageSignature = "";

function pageChanged() {

    // Intro page
    const startButton = [...document.querySelectorAll("button")]
        .find(button =>
            button.innerText.trim() === "Start now" &&
            button.offsetParent !== null
        );

    if (startButton) {

        const signature = "intro";

        if (signature === lastPageSignature) {

            return false;

        }

        lastPageSignature = signature;

        return true;

    }

    // Normal question pages
    const questions = getQuestions();

    if (questions.length === 0) {

        return false;

    }

    const signature = questions[0].innerText;

    if (signature === lastPageSignature) {

        return false;

    }

    lastPageSignature = signature;

    return true;

}

    function clickStartNow() {

    const interval = setInterval(function () {

        const button = [...document.querySelectorAll("button")]
            .find(button =>
                button.innerText.trim() === "Start now" &&
                button.offsetParent !== null
            );

        if (!button) {

            return;

        }

        button.click();

        clearInterval(interval);

        logSuccess(
            "Start Now clicked."
        );

    }, 500);

}

function fillPage0() {

    console.clear();

    const buttons = [...document.querySelectorAll("button")];

    console.log("Buttons found:", buttons.length);

    buttons.forEach((button, i) => {

        console.log(
            i,
            button.innerText,
            button.offsetParent !== null
        );

    });

    const startButton = buttons.find(button =>
        button.innerText.trim() === "Start now" &&
        button.offsetParent !== null
    );

    console.log("Start button:", startButton);

    if (!startButton) {

        logError("Start button not found.");

        return;

    }

    console.log("About to click...");

    startButton.click();

    console.log("Click sent.");

}

function fillPage1(payload) {

    nextStep(
        1,
        10,
        "Scanning Page 1"
    );

    setStatus(
        "Waiting for form to stabilize..."
    );

    log(
        "WAIT",
        "Allowing Microsoft Forms to finish loading."
    );

    setTimeout(function () {

        fillText(
            findQuestion(FORM_MAPPING.employeeId),
            payload.empId
        );

        logSuccess(
            "Employee ID synchronized."
        );

        selectRadio(
            findQuestion(FORM_MAPPING.attendanceStatus),
            payload.attendanceStatus
        );

        logSuccess(
            "Attendance selected."
        );

        fillText(
            findQuestion(FORM_MAPPING.date),
            payload.date
        );

        logSuccess(
            "Date injected."
        );

        log(
            "WAIT",
            "Navigating to Page 2..."
        );

        clickNext();

    }, 1500);

}

function fillPage2(payload) {

    nextStep(
        3,
        10,
        "Injecting EOD Report"
    );

    const questions = getQuestions();

    if (questions.length === 0) {

        logError("No questions found.");

        return;

    }

    fillText(
        questions[0],
        payload.report
    );

    logSuccess(
        "Report injected."
    );

    log(
        "WAIT",
        "Navigating to Page 3..."
    );

    clickNext();

}

function fillPage3(payload) {

    nextStep(
        5,
        10,
        "Applying Ratings"
    );

    const ratings = getQuestions();

    if (ratings.length >= 2) {

        selectRating(
            ratings[0],
            payload.starRating6
        );

        logSuccess(
            "Rating #1 applied."
        );

        selectRating(
            ratings[1],
            payload.starRating7
        );

        logSuccess(
            "Rating #2 applied."
        );

    } else {

        logError(
            "Unable to locate rating questions."
        );

    }

    log(
        "WAIT",
        "Navigating to Page 4..."
    );

    clickNext();

}

function fillPage4(payload) {

    nextStep(
        7,
        10,
        "Completing Final Questions"
    );

    const questions = getQuestions();

    if (questions.length >= 2) {

        fillText(
            questions[0],
            payload.defaultText8
        );

        logSuccess(
            "Question 8 completed."
        );

        fillText(
            questions[1],
            payload.defaultText9
        );

        logSuccess(
            "Question 9 completed."
        );

    } else {

        logError(
            "Unable to locate final questions."
        );

    }

    nextStep(
        9,
        10,
        "Awaiting Screenshot"
    );

    logManual(
        "Upload today's screenshot."
    );

    logManual(
        "Review the completed form."
    );

    logManual(
        "Click Submit when ready."
    );

    setStatus(
        "Mission Complete",
        "#50fa7b"
    );

    setProgress(
        10,
        10
    );

log(
    "DONE",
    "Mission completed successfully."
);
stopTimer();
    history.replaceState(
    {},
    "",
    location.pathname
);



}

const PAGE_HANDLERS = [

    fillPage0,
    fillPage1,
    fillPage2,
    fillPage3,
    fillPage4

];

let currentPage = 0;

const automation = setInterval(function () {

    if (!pageChanged()) {

        return;

    }

    if (currentPage >= PAGE_HANDLERS.length) {

        clearInterval(automation);

        return;

    }
console.log(
    "Current Page:",
    currentPage,
    PAGE_HANDLERS[currentPage].name
);
    PAGE_HANDLERS[currentPage](payload);

    currentPage++;

}, POLL_INTERVAL);

})();