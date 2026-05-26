/* =====================================================================
   VOCABULARY QUIZ v2 — University of Costa Rica
   Prof. Roberto Mesén Hidalgo · Designed by Rosney
   ===================================================================== */

// ⚠️ IMPORTANT: paste your Apps Script deployment URL here.
// It must end in /exec — NOT a Google Sheets link.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFz2G1LF2yQLcgsfVsjzfvhzBvU0ECEdTlkLkGqSjAcydjZOGZd-Keu0L-DFmzcvzF/exec";

const TOTAL = 20;

/* ------------------------------------------------------------------ */
/*  ANSWER KEY                                                         */
/* ------------------------------------------------------------------ */
const TYPED = {
    q1: ["abundance"],
    q2: ["align"],
    q3: ["skeptical","sceptical"],
    q4: ["enhance"],
    q5: ["solitude"],
    q6: ["overwhelmed"],
    q7: ["persona"],
    q8: ["velocity"]
};
const CHOICE = {
    q9:  "c",   // absolutely essential
    q10: "b",   // short personal story
    q11: "b",   // make something worse
    q12: "c",   // peaceful state of being alone
    q13: "c",   // "talked" (talked into)
    q14: "a",   // overwhelmed
    q15: "d",   // anonymity
    q16: "false",  // narcissistic — FALSE
    q17: "false",  // transcend — FALSE
    q18: "false",  // superficial — FALSE
    q19: "false",  // collaborate — FALSE
    q20: "true"    // advocate — TRUE
};

const CORRECT_LABEL = {
    q1:"abundance", q2:"align", q3:"skeptical", q4:"enhance",
    q5:"solitude",  q6:"overwhelmed", q7:"persona", q8:"velocity",
    q9:"C",  q10:"B", q11:"B", q12:"C",
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
function $(sel){ return document.querySelector(sel); }
function $$(sel){ return Array.from(document.querySelectorAll(sel)); }

/* ------------------------------------------------------------------ */
/*  1. START GATE                                                       */
/* ------------------------------------------------------------------ */
$("#startBtn").addEventListener("click", () => {
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
});
$("#studentName").addEventListener("keydown", e => {
    if (e.key === "Enter") $("#startBtn").click();
});

/* ------------------------------------------------------------------ */
/*  2. TIMER                                                            */
/* ------------------------------------------------------------------ */
function startTimer() {
    timerInterval = setInterval(() => {
        elapsedSec++;
        const m = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
        const s = String(elapsedSec % 60).padStart(2, "0");
        const timerEl = $("#timer");
        timerEl.textContent = `${m}:${s}`;
        if (elapsedSec >= 55 * 60) timerEl.classList.add("warn"); // 55-minute warning
    }, 1000);
}
function stopTimer() {
    clearInterval(timerInterval);
}

/* ------------------------------------------------------------------ */
/*  3. PROGRESS BAR                                                     */
/* ------------------------------------------------------------------ */
function updateProgress() {
    let answered = 0;
    for (let i = 1; i <= TOTAL; i++) {
        const key = "q" + i;
        const blank = $(`input.blank[name="${key}"]`);
        const radio = $(`input[type=radio][name="${key}"]:checked`);
        const done = (blank && blank.value.trim()) || radio;
        if (done) answered++;
        const card = $(`.q[data-q="${i}"]`);
        if (card) card.classList.toggle("answered", !!done);
    }
    const pct = (answered / TOTAL * 100).toFixed(0);
    $("#progFill").style.width = pct + "%";
    $("#progText").textContent = `${answered}/${TOTAL}`;
    const note = $("#unansNote");
    if (note) {
        const left = TOTAL - answered;
        note.textContent = left > 0 ? `⚠ ${left} question(s) unanswered.` : "";
    }
}
document.addEventListener("input",  updateProgress);
document.addEventListener("change", updateProgress);

/* ------------------------------------------------------------------ */
/*  4. ANTI-CHEAT — block tab switch / window blur                     */
/* ------------------------------------------------------------------ */
document.addEventListener("visibilitychange", () => {
    if (!quizStarted || submitted) return;
    if (document.hidden) flagLeave();
});
window.addEventListener("blur", () => {
    if (!quizStarted || submitted) return;
    flagLeave();
});

function flagLeave() {
    leaveCount++;
    const overlay = $("#blurOverlay");
    overlay.hidden = false;
    const strip = $("#warnStrip");
    strip.hidden = false;
    $("#warnCount").textContent =
        `(${leaveCount} time${leaveCount > 1 ? "s" : ""} flagged)`;
}

$("#returnBtn").addEventListener("click", () => {
    $("#blurOverlay").hidden = true;
});

/* ------------------------------------------------------------------ */
/*  5. BLOCK NAVIGATION — beforeunload                                  */
/* ------------------------------------------------------------------ */
window.addEventListener("beforeunload", e => {
    if (quizStarted && !submitted) {
        e.preventDefault();
        e.returnValue = "Your quiz is not submitted yet. Are you sure you want to leave?";
        return e.returnValue;
    }
});

/* ------------------------------------------------------------------ */
/*  6. BLOCK RELOAD AFTER SUBMIT — store flag in sessionStorage        */
/* ------------------------------------------------------------------ */
if (sessionStorage.getItem("quizDone") === "yes") {
    document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
            background:#0d1b2a;font-family:'Nunito Sans',sans-serif;padding:20px;">
            <div style="background:#fff;border-radius:16px;padding:44px 36px;max-width:480px;
                text-align:center;border-top:6px solid #c8750a;">
                <div style="font-size:56px;margin-bottom:16px;">🔒</div>
                <h2 style="font-family:'Fraunces',serif;font-size:26px;margin-bottom:12px;color:#0a4f4b;">
                    Quiz already submitted
                </h2>
                <p style="font-size:16px;color:#3d4b57;line-height:1.6;">
                    You have already submitted your quiz. <br>
                    <strong>Reloading the page is not allowed.</strong><br><br>
                    If you believe this is an error, contact your professor.
                </p>
            </div>
        </div>`;
}

/* ------------------------------------------------------------------ */
/*  7. SUBMIT & GRADE                                                   */
/* ------------------------------------------------------------------ */
$("#quizForm").addEventListener("submit", e => {
    e.preventDefault();
    if (submitted) return;

    if (!studentName) {
        alert("No name recorded. Please refresh and start again.");
        return;
    }

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
            correct     = radio && radio.value === CHOICE[key];
        }

        if (correct) {
            score++;
            correctList.push(`Q${i}`);
            detailList.push(`Q${i}: ${studentAns} ✓`);
        } else {
            wrongList.push(`Q${i}`);
            detailList.push(`Q${i}: "${studentAns}" ✗ → correct: ${CORRECT_LABEL[key]}`);
        }
    }

    const pct      = Math.round(score / TOTAL * 100);
    const elapsed  = formatTime(elapsedSec);
    const detalle  = detailList.join(" | ");

    sendToSheets({
        type:        "quiz",
        nombre:      studentName,
        unidad:      "Units 4 & 6",
        puntaje:     `${score}/${TOTAL}`,
        porcentaje:  `${pct}%`,
        correctas:   correctList.join(", ") || "—",
        incorrectas: wrongList.join(", ")   || "—",
        detalle:     `[time: ${elapsed}] [leaves: ${leaveCount}] ${detalle}`
    });

    lockQuiz();

    // Prevent reload
    sessionStorage.setItem("quizDone", "yes");

    // Final block on refresh attempt
    window.addEventListener("beforeunload", e2 => {
        e2.preventDefault();
        e2.returnValue = "The quiz has been submitted. Reloading is not allowed.";
        return e2.returnValue;
    });
});

/* ------------------------------------------------------------------ */
/*  8. LOCK QUIZ                                                        */
/* ------------------------------------------------------------------ */
function lockQuiz() {
    $$("input").forEach(el => el.disabled = true);
    const btn = $(".submit-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Submitted ✓"; }
}

/* ------------------------------------------------------------------ */
/*  9. SEND TO GOOGLE SHEETS                                           */
/* ------------------------------------------------------------------ */
function sendToSheets(data) {
    const el = $("#saveStatus");
    el.className = "save-status saving";
    el.textContent = "Sending your quiz to the professor… ⏳";
    el.style.display = "block";

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
        el.className = "save-status error";
        el.textContent = "⚠ Configuration error — contact your professor.";
        return;
    }

    fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
    })
    .then(r => r.json())
    .then(res => {
        if (res.success) {
            el.className = "save-status saved";
            el.innerHTML =
                `✅ Quiz submitted! Thank you, <strong>${data.nombre}</strong>.<br>
                 Score: <strong>${data.puntaje}</strong> (${data.porcentaje})<br>
                 Your professor will review your answers.`;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            throw new Error(res.error || "Unknown error");
        }
    })
    .catch(err => {
        console.error(err);
        el.className = "save-status error";
        el.textContent = "⚠ Could not send. Check your internet connection and ask your professor.";
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
