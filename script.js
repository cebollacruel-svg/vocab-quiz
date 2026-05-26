/* =====================================================================
   VOCABULARY QUIZ v3 — University of Costa Rica
   Prof. Roberto Mesén Hidalgo · Designed by Rosney
   - No emojis in UI
   - Scroll to Section A after start
   - Gold blinking timer (CSS-driven)
   - Options lift on hover (CSS-driven)
   - Leave = PERMANENT block, no return
   - Reload after submit = blocked via sessionStorage
   ===================================================================== */

// Paste your Apps Script deployment URL here (ends in /exec)
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

const TOTAL = 20;

/* ------------------------------------------------------------------ */
/*  ANSWER KEY                                                          */
/* ------------------------------------------------------------------ */
const TYPED = {
    q1:["abundance"],
    q2:["align"],
    q3:["skeptical","sceptical"],
    q4:["enhance"],
    q5:["solitude"],
    q6:["overwhelmed"],
    q7:["persona"],
    q8:["velocity"]
};
const CHOICE = {
    q9:"c", q10:"b", q11:"b", q12:"c",
    q13:"c", q14:"a", q15:"d",
    q16:"false", q17:"false", q18:"false", q19:"false", q20:"true"
};
const CORRECT_LABEL = {
    q1:"abundance", q2:"align", q3:"skeptical", q4:"enhance",
    q5:"solitude", q6:"overwhelmed", q7:"persona", q8:"velocity",
    q9:"C", q10:"B", q11:"B", q12:"C",
    q13:"C (talked)", q14:"A (overwhelmed)", q15:"D (anonymity)",
    q16:"FALSE", q17:"FALSE", q18:"FALSE", q19:"FALSE", q20:"TRUE"
};

/* ------------------------------------------------------------------ */
/*  STATE                                                               */
/* ------------------------------------------------------------------ */
let studentName   = "";
let quizStarted   = false;
let submitted     = false;
let leaveCount    = 0;
let timerInterval = null;
let elapsedSec    = 0;

/* ------------------------------------------------------------------ */
/*  HELPERS                                                             */
/* ------------------------------------------------------------------ */
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ------------------------------------------------------------------ */
/*  BLOCK IF ALREADY SUBMITTED (reload protection)                     */
/* ------------------------------------------------------------------ */
if (sessionStorage.getItem("quizDone") === "yes") {
    document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
            background:#0d1b2a;font-family:'Nunito Sans',sans-serif;padding:20px;">
            <div style="background:#fff;border-radius:16px;padding:44px 36px;max-width:480px;
                text-align:center;border-top:6px solid #b02020;">
                <div style="width:80px;height:80px;line-height:80px;font-size:42px;font-weight:900;
                    background:#b02020;color:#fff;border-radius:50%;margin:0 auto 20px;
                    font-family:'Fraunces',serif;">X</div>
                <h2 style="font-family:'Fraunces',serif;font-size:26px;margin-bottom:12px;color:#0a4f4b;">
                    Quiz already submitted
                </h2>
                <p style="font-size:16px;color:#3d4b57;line-height:1.6;">
                    You have already submitted your quiz.<br>
                    <strong>Reloading the page is not allowed.</strong><br><br>
                    Contact your professor if you believe this is an error.
                </p>
            </div>
        </div>`;
}

/* ------------------------------------------------------------------ */
/*  1. START GATE                                                       */
/* ------------------------------------------------------------------ */
const startBtn = $("#startBtn");
if (startBtn) {
    startBtn.addEventListener("click", () => {
        const n = $("#studentName").value.trim();
        if (!n) {
            $("#studentName").focus();
            $("#studentName").style.borderColor = "var(--red)";
            return;
        }
        studentName = n;
        $("#startGate").hidden = true;
        $("#quizBody").hidden  = false;
        quizStarted = true;
        startTimer();
        updateProgress();

        // Scroll to Section A after a short delay
        setTimeout(() => {
            const sectionA = $("#sectionA");
            if (sectionA) {
                sectionA.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 180);
    });

    $("#studentName").addEventListener("keydown", e => {
        if (e.key === "Enter") startBtn.click();
    });
}

/* ------------------------------------------------------------------ */
/*  2. TIMER                                                            */
/* ------------------------------------------------------------------ */
function startTimer() {
    timerInterval = setInterval(() => {
        elapsedSec++;
        const m = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
        const s = String(elapsedSec % 60).padStart(2, "0");
        $("#timer").textContent = `${m}:${s}`;
    }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }

/* ------------------------------------------------------------------ */
/*  3. PROGRESS                                                         */
/* ------------------------------------------------------------------ */
function updateProgress() {
    let answered = 0;
    for (let i = 1; i <= TOTAL; i++) {
        const key   = "q" + i;
        const blank = $(`input.blank[name="${key}"]`);
        const radio = $(`input[type=radio][name="${key}"]:checked`);
        const done  = (blank && blank.value.trim()) || radio;
        if (done) answered++;
        const card = $(`.q[data-q="${i}"]`);
        if (card) card.classList.toggle("answered", !!done);
    }
    const pct = (answered / TOTAL * 100).toFixed(0);
    const fill = $("#progFill");
    if (fill) fill.style.width = pct + "%";
    const txt = $("#progText");
    if (txt) txt.textContent = `${answered}/${TOTAL}`;

    const note = $("#unansNote");
    if (note) {
        const left = TOTAL - answered;
        note.textContent = left > 0 ? `${left} question(s) still unanswered.` : "";
    }
}
document.addEventListener("input",  updateProgress);
document.addEventListener("change", updateProgress);

/* ------------------------------------------------------------------ */
/*  4. ANTI-CHEAT — leave = PERMANENT block (no return button)         */
/* ------------------------------------------------------------------ */
function permanentBlock() {
    if (submitted) return; // don't block after submit
    leaveCount++;
    stopTimer();
    quizStarted = false; // disable future triggers

    // Store as flagged but not submitted
    sessionStorage.setItem("quizFlagged", "yes");

    // Send flag to Sheets immediately
    sendToSheets({
        type:        "quiz",
        nombre:      studentName || "(unnamed)",
        unidad:      "Units 4 & 6",
        puntaje:     "FLAGGED — left the page",
        porcentaje:  "0%",
        correctas:   "—",
        incorrectas: "—",
        detalle:     `[FLAGGED at ${formatTime(elapsedSec)} — student left the quiz page]`
    }, /*silent=*/true);

    // Show permanent block overlay
    const overlay = $("#blockedOverlay");
    if (overlay) overlay.hidden = false;

    // Disable all inputs
    $$("input").forEach(el => el.disabled = true);
    const btn = $(".submit-btn");
    if (btn) { btn.disabled = true; }
}

document.addEventListener("visibilitychange", () => {
    if (!quizStarted || submitted) return;
    if (document.hidden) permanentBlock();
});

window.addEventListener("blur", () => {
    if (!quizStarted || submitted) return;
    permanentBlock();
});

/* ------------------------------------------------------------------ */
/*  5. BEFOREUNLOAD — warn on close / navigate away                    */
/* ------------------------------------------------------------------ */
window.addEventListener("beforeunload", e => {
    if (quizStarted && !submitted) {
        e.preventDefault();
        e.returnValue = "Your quiz is not submitted yet. Leaving will flag your session.";
        return e.returnValue;
    }
    if (submitted) {
        e.preventDefault();
        e.returnValue = "The quiz has been submitted. Reloading is not allowed.";
        return e.returnValue;
    }
});

/* ------------------------------------------------------------------ */
/*  6. SUBMIT                                                           */
/* ------------------------------------------------------------------ */
const quizForm = $("#quizForm");
if (quizForm) {
    quizForm.addEventListener("submit", e => {
        e.preventDefault();
        if (submitted || !quizStarted) return;

        stopTimer();
        submitted = true;

        let score = 0;
        const correctList  = [];
        const wrongList    = [];
        const detailList   = [];

        for (let i = 1; i <= TOTAL; i++) {
            const key = "q" + i;
            let studentAns = "—";
            let correct    = false;

            if (TYPED[key]) {
                const blank = $(`input.blank[name="${key}"]`);
                const val   = blank ? blank.value.trim() : "";
                studentAns  = val || "—";
                correct     = TYPED[key].includes(val.toLowerCase());
            } else {
                const radio = $(`input[type=radio][name="${key}"]:checked`);
                studentAns  = radio ? radio.value : "—";
                correct     = !!(radio && radio.value === CHOICE[key]);
            }

            if (correct) {
                score++;
                correctList.push(`Q${i}`);
                detailList.push(`Q${i}: ${studentAns} (correct)`);
            } else {
                wrongList.push(`Q${i}`);
                detailList.push(`Q${i}: "${studentAns}" wrong, correct=${CORRECT_LABEL[key]}`);
            }
        }

        const pct    = Math.round(score / TOTAL * 100);
        const detail = `[time:${formatTime(elapsedSec)}] [leaves:${leaveCount}] ` + detailList.join(" | ");

        sendToSheets({
            type:        "quiz",
            nombre:      studentName,
            unidad:      "Units 4 & 6",
            puntaje:     `${score}/${TOTAL}`,
            porcentaje:  `${pct}%`,
            correctas:   correctList.join(", ") || "none",
            incorrectas: wrongList.join(", ")   || "none",
            detalle:     detail
        });

        lockQuiz();
        sessionStorage.setItem("quizDone", "yes");
    });
}

/* ------------------------------------------------------------------ */
/*  7. LOCK                                                             */
/* ------------------------------------------------------------------ */
function lockQuiz() {
    $$("input").forEach(el => el.disabled = true);
    const btn = $(".submit-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Submitted"; }
}

/* ------------------------------------------------------------------ */
/*  8. SEND TO SHEETS                                                   */
/* ------------------------------------------------------------------ */
function sendToSheets(data, silent = false) {
    const el = silent ? null : $("#saveStatus");

    if (el) {
        el.className     = "save-status saving";
        el.textContent   = "Sending your quiz to the professor...";
        el.style.display = "block";
    }

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
        if (el) {
            el.className   = "save-status error";
            el.textContent = "Configuration error — contact your professor.";
        }
        return;
    }

    fetch(APPS_SCRIPT_URL, {
        method:  "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body:    JSON.stringify(data)
    })
    .then(r => r.json())
    .then(res => {
        if (!el) return;
        if (res.success) {
            el.className = "save-status saved";
            el.innerHTML =
                `Quiz submitted. Thank you, <strong>${data.nombre}</strong>.<br>
                 Score: <strong>${data.puntaje}</strong> (${data.porcentaje})<br>
                 Your professor will review your answers.`;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            throw new Error(res.error || "Unknown error");
        }
    })
    .catch(err => {
        console.error(err);
        if (el) {
            el.className   = "save-status error";
            el.textContent = "Could not send. Check your internet and contact your professor.";
        }
    });
}

/* ------------------------------------------------------------------ */
/*  UTIL                                                                */
/* ------------------------------------------------------------------ */
function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
