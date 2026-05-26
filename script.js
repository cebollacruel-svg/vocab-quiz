/* =====================================================================
   VOCABULARY QUIZ 
   University of Costa Rica · Professor: Roberto Mesén Hidalgo
   - Grades silently, locks after submit, sends per-question detail.
   ===================================================================== */

// 🔧 PASTE YOUR APPS SCRIPT URL HERE (the Vocabulary Results deployment)
const APPS_SCRIPT_URL = "https://docs.google.com/spreadsheets/d/1JYCI2woSjs0EnqYJOnof05aoU44qJz9Ny22VRl5yVyo/edit?gid=481084996#gid=481084996";

const TOTAL = 18;

/* ---------------------------------------------------------------------
   ANSWER KEY
   Type-in answers accept a few valid spellings/forms (lowercase).
--------------------------------------------------------------------- */
const TYPED = {
    q1:["abundance"],
    q2:["align"],
    q3:["skeptical","sceptical"],
    q4:["enhance"],
    q5:["vitality"],
    q6:["overwhelmed"]
};
const CHOICE = {
    q7:"b",   // hidden
    q8:"a",   // companionship
    q9:"c",   // authentic
    q10:"b",  // fame
    q11:"b",  // make a move
    q12:"c",  // debacle
    q13:"b",  // get a grip
    q14:"b",  // advocate
    q15:"c",  // huge
    q16:"b",  // speed
    q17:"a",  // self-centered
    q18:"b"   // short personal story
};

// Readable labels for the detail log (what the correct answer "is")
const CORRECT_LABEL = {
    q1:"abundance", q2:"align", q3:"skeptical", q4:"enhance", q5:"vitality", q6:"overwhelmed",
    q7:"B (hidden)", q8:"A (companionship)", q9:"C (authentic)", q10:"B (fame)",
    q11:"B (make a move)", q12:"C (debacle)", q13:"B (get a grip)", q14:"B (advocate)", q15:"C (huge)",
    q16:"B (speed)", q17:"A (self-centered)", q18:"B (short story)"
};

/* ---------------------------------------------------------------------
   PROGRESS TRACKER
--------------------------------------------------------------------- */
function countAnswered(){
    let n=0;
    for(let i=1;i<=TOTAL;i++){
        const key="q"+i;
        const blank=document.querySelector(`input.blank[name="${key}"]`);
        const radio=document.querySelector(`input[type=radio][name="${key}"]:checked`);
        if(blank && blank.value.trim()) n++;
        else if(radio) n++;
    }
    return n;
}
function updateProgress(){
    const n=countAnswered();
    document.getElementById("progressFill").style.width=(n/TOTAL*100)+"%";
    document.getElementById("progressLabel").textContent=`${n} / ${TOTAL} answered`;
    for(let i=1;i<=TOTAL;i++){
        const key="q"+i;
        const card=document.querySelector(`.q[data-q="${i}"]`);
        const blank=document.querySelector(`input.blank[name="${key}"]`);
        const radio=document.querySelector(`input[type=radio][name="${key}"]:checked`);
        const done = (blank && blank.value.trim()) || radio;
        if(card) card.classList.toggle("answered", !!done);
    }
}
document.addEventListener("input", updateProgress);
document.addEventListener("change", updateProgress);

/* ---------------------------------------------------------------------
   SUBMIT
--------------------------------------------------------------------- */
document.getElementById("quizForm").addEventListener("submit", e=>{
    e.preventDefault();

    const name=document.getElementById("studentName").value.trim();
    if(!name){
        const f=document.getElementById("studentName");
        f.focus(); f.style.borderColor="var(--bad)";
        alert("Please write your full name before submitting.");
        return;
    }

    let score=0;
    const detail=[];

    for(let i=1;i<=TOTAL;i++){
        const key="q"+i;
        let studentAns="—", correct=false;

        if(TYPED[key]){
            const blank=document.querySelector(`input.blank[name="${key}"]`);
            const val=blank.value.trim();
            studentAns = val || "—";
            correct = TYPED[key].includes(val.toLowerCase());
        }else{
            const radio=document.querySelector(`input[type=radio][name="${key}"]:checked`);
            studentAns = radio ? radio.value.toUpperCase() : "—";
            correct = radio && radio.value===CHOICE[key];
        }

        if(correct){ score++; detail.push(`Q${i}: ${studentAns} ✓`); }
        else { detail.push(`Q${i}: ${studentAns} ✗ (ans: ${CORRECT_LABEL[key]})`); }
    }

    const percent=Math.round(score/TOTAL*100);
    const detalle=detail.join("  |  ");

    sendQuiz({
        type:"quiz",
        nombre:name,
        unidad:"Units 4 & 6",
        puntaje:`${score}/${TOTAL}`,
        porcentaje:`${percent}%`,
        detalle:detalle
    });

    lockQuiz();
});

/* ---------------------------------------------------------------------
   LOCK
--------------------------------------------------------------------- */
function lockQuiz(){
    document.querySelectorAll("input").forEach(el=>el.disabled=true);
    const btn=document.querySelector(".submit");
    btn.disabled=true; btn.textContent="Submitted";
}

/* ---------------------------------------------------------------------
   SEND TO SHEETS
--------------------------------------------------------------------- */
function sendQuiz(data){
    const el=document.getElementById("saveStatus");
    el.className="save-status saving";
    el.textContent="Submitting your quiz…";

    if(!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PASTE_YOUR")){
        el.className="save-status error";
        el.textContent="⚠ Configuration error — ask your teacher.";
        return;
    }

    fetch(APPS_SCRIPT_URL,{
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify(data)
    })
    .then(r=>r.json())
    .then(res=>{
        if(res.success){
            el.className="save-status saved";
            el.innerHTML=`✓ Your quiz was submitted successfully.<br>Thank you, <strong>${data.nombre}</strong>.`;
            el.scrollIntoView({behavior:"smooth",block:"center"});
        }else{ throw new Error(); }
    })
    .catch(()=>{
        el.className="save-status error";
        el.textContent="⚠ Could not submit. Check your internet and try again.";
    });
}
