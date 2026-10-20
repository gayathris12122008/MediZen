const dailyTips = ["Drink 8 glasses of water today","Take a short 10-minute walk after eating","Sleep for 7-8 hours tonight","Eat more fruits and vegetables","Do 5 mins deep breathing","Avoid phone 30 mins before sleep","Wash hands before every meal"];
const tips = {
  fever: ["Drink plenty of water","Take rest and sleep well","Use cold wet cloth on forehead","Wear light clothes","Check temperature every 4 hours"],
  cold: ["Drink warm water and soups","Steam inhalation twice a day","Take rest, avoid cold drinks","Gargle with salt water","Wash hands often"],
  headache: ["Rest in quiet dark room","Drink enough water","Avoid phone laptop screen","Light massage on forehead","Sleep for some time"],
  cough: ["Drink warm water and honey","Do steam inhalation twice daily","Avoid dust and cold air","Gargle warm water","If more than 5 days see doctor"],
  sorethroat: ["Gargle with warm salt water","Drink warm honey lemon water","Avoid cold drinks","Take rest","Steam inhalation helps"],
  stomachpain: ["Avoid spicy and oily foods","Drink warm water with ginger","Do not lie down right after eating","Eat small meals","If severe pain, consult doctor"],
  acidity: ["Avoid spicy, fried foods","Do not skip meals","Drink cold milk","Avoid lying down after eating","Drink plenty of water"],
  diarrhea: ["Drink ORS and plenty of water","Eat light foods like curd rice, banana","Avoid spicy and oily foods","Wash hands before eating","Take rest"],
  constipation: ["Drink 3 liters water daily","Eat fiber foods like papaya, oats, vegetables","Walk 20 mins daily","Avoid junk food","Do not hold stool for long"],
  vomiting: ["Sip small amounts of water slowly","Avoid strong smells and oily foods","Take rest, sit upright","Eat light foods like toast","If continues, see doctor"],
  backpain: ["Sit straight, avoid long sitting","Do light stretching","Use proper pillow","Apply hot water bag","Avoid lifting heavy weight"],
  neckpain: ["Do not look down at phone long time","Do neck rotations slowly","Apply warm compress","Keep correct sleeping posture","Take short breaks from laptop"],
  knee_pain: ["Avoid sitting on floor for long","Do gentle leg stretching","Apply ice pack 10 mins","Avoid high heels and heavy weight","If swelling, see doctor"],
  eyestrain: ["Follow 20-20-20 rule every 20 mins","Reduce screen brightness","Blink often","Keep screen at arm length","Sleep 7 to 8 hours"],
  insomnia: ["Avoid phone 1 hour before sleep","Sleep at same time daily","Avoid coffee in evening","Keep room dark and quiet","Read book instead of scrolling"],
  anxiety: ["Do deep breathing 4 sec in 6 sec out","Write down your worries","Go for short walk","Talk to friend or family","Listen to calm music"],
  stress: ["Take 5 mins deep breathing","Go for walk outside","Write 3 good things of today","Talk to someone","Do hobby like music or drawing for 15 mins"],
  dehydration: ["Drink water every hour","Drink coconut water or ORS","Avoid direct sun in afternoon","Eat water fruits like watermelon","Check urine color should be light"],
  sunburn: ["Apply aloe vera gel","Drink plenty of water","Avoid sun from 11am to 3pm","Use cold wet cloth on area","Use sunscreen next time"],
  acne: ["Wash face twice daily","Do not touch pimples","Avoid oily and fried foods","Drink 2 to 3 liters water","Change pillow cover every 2 days"],
  dandruff: ["Wash hair twice a week","Use anti dandruff shampoo","Do not apply too much oil","Avoid sharing comb","Rinse hair properly"],
  hairfall: ["Eat protein foods like eggs, dal","Do not wash hair with hot water","Avoid tight hair styles","Sleep well and reduce stress","Oil massage once a week"],
  period: ["Use hot water bag on stomach","Drink warm water","Light walking helps pain","Rest and avoid heavy work","Eat iron foods like dates and spinach"],
  lowenergy: ["Sleep 7 to 8 hours at fixed time","Eat breakfast daily","Drink water first after waking","Walk in morning sunlight 10 mins","Reduce sugar and junk food"],
  dizziness: ["Sit down immediately and rest","Drink water","Do not stand up suddenly","Eat something if you skipped meal","If frequent, check BP and see doctor"],
  vision: ["Less mobile/TV", "eat carrots", "check eye yearly."],
  arthritis: ["Gentle exercise", "warm oil massage", "keep weight control."],
  bp: ["Less salt", "daily walking", "less tension", "check BP daily."],
  diabetes: ["Less sugar", "walk daily", "eat vegetables", "check sugar regularly."],
  chestpain: ["If severe", "go to hospital immediately", "Don't ignore."]
};

function getDayNumber(){ return new Date().getDate() % dailyTips.length; }
document.addEventListener("DOMContentLoaded", function(){
  let el = document.getElementById("dailyTip");
  if(el) el.innerText = dailyTips[getDayNumber()];
});

function showTip(issue){
  let history = JSON.parse(localStorage.getItem("healthTipsHistory") || "[]");
  let filtered = history.filter(h => h.issue.toLowerCase() === issue.toLowerCase());
  let tipEl = document.getElementById("tipDisplay");
  
  let html = "<div class='card'><h3>"+issue.toUpperCase()+" - TIPS</h3><ul>";
  tips[issue].forEach(t=>{ html += "<li>"+t+"</li>"; });
  html += "</ul>";
  
  html += "<hr style='margin:15px 0;'><div style='text-align:center;'>";
  html += "<button onclick=\"markHistory('"+issue+"')\" style='background:#1e40af; color:white; padding:10px 20px; border-radius:8px; border:none; cursor:pointer; font-weight:bold;'>Mark History</button>";
  html += "<p style='font-size:12px; color:#666; margin-top:8px;'>Click to save today: "+new Date().toLocaleDateString('en-GB')+"</p>";
  html += "</div>";

  html += "<h4 style='color:#1e3a8a; margin-top:15px;'>Past History for "+issue.toUpperCase()+"</h4>";
  if(filtered.length==0){
    html += "<p style='color:#777; font-size:14px;'>No past history yet.</p>";
  } else {
    html += "<ul>";
    filtered.forEach(h=>{
      html += "<li><b>"+h.date+"</b></li>";
    });
    html += "</ul><button onclick=\"clearIssueHistory('"+issue+"')\" style='background:#b91c1c; font-size:12px; padding:5px 10px; border-radius:4px; color:white; border:none;'>Clear "+issue+" History</button>";
  }
  html += "</div>";
  tipEl.innerHTML = html;
}

function markHistory(issue){
  let today = new Date().toLocaleDateString('en-GB');
  let history = JSON.parse(localStorage.getItem("healthTipsHistory") || "[]");
  history.unshift({issue:issue, date:today});
  localStorage.setItem("healthTipsHistory", JSON.stringify(history));
  showTip(issue);
}

function clearIssueHistory(issue){
  if(!confirm("Clear only "+issue+" history?")) return;
  let history = JSON.parse(localStorage.getItem("healthTipsHistory") || "[]");
  history = history.filter(h => h.issue.toLowerCase() !== issue.toLowerCase());
  localStorage.setItem("healthTipsHistory", JSON.stringify(history));
  showTip(issue);
}