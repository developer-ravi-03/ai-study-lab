const GEMINI_MODELS=["gemini-3.8-flash","gemini-3.7-flash"];
const GEMINI_BASE="https://generativelanguage.googleapis.com/v1beta/models/";
window.AIStudyLab=window.AIStudyLab||{};
AIStudyLab.getApiKey=()=>sessionStorage.getItem("gemini_api_key")||"";
AIStudyLab.setApiKey=k=>sessionStorage.setItem("gemini_api_key",k.trim());
AIStudyLab.clearApiKey=()=>sessionStorage.removeItem("gemini_api_key");
AIStudyLab.escapeHtml=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML};
AIStudyLab.sleep=ms=>new Promise(r=>setTimeout(r,ms));
AIStudyLab.setLoading=on=>{let el=document.querySelector("#aiLoading");if(on){if(!el){el=document.createElement("div");el.id="aiLoading";el.innerHTML='<div class="ai-loader-card"><div class="ai-spinner"></div><strong>AI is working</strong><span>Generating your result…</span></div>';document.body.appendChild(el)}el.classList.add("show");document.body.setAttribute("aria-busy","true")}else{if(el)el.classList.remove("show");document.body.removeAttribute("aria-busy")}};
AIStudyLab.generate=async(prompt,{json=false}={})=>{
 const key=AIStudyLab.getApiKey();
 if(!key) throw new Error("Add your Gemini API key from AI Settings first.");
 const body={contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.35,maxOutputTokens:5000}};
 if(json) body.generationConfig.responseMimeType="application/json";
 AIStudyLab.setLoading(true);
 try{
  let lastError;
  for(const model of GEMINI_MODELS){
   for(let attempt=0;attempt<3;attempt++){
    try{
     const res=await fetch(GEMINI_BASE+model+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify(body)});
     const data=await res.json();
     if(res.ok)return data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";
     const retryable=res.status===429||res.status===500||res.status===502||res.status===503||res.status===504;
     lastError=new Error(data?.error?.message||("Gemini request failed ("+res.status+")."));
     if(!retryable)throw lastError;
     if(attempt<2)await AIStudyLab.sleep(1200*Math.pow(2,attempt));
    }catch(err){lastError=err;if(attempt<2&&/fetch|network/i.test(err.message))await AIStudyLab.sleep(1200*Math.pow(2,attempt));else if(attempt===2)break}
   }
  }
  throw lastError||new Error("Gemini is temporarily unavailable. Please try again.");
 }finally{AIStudyLab.setLoading(false)}
};
document.addEventListener("DOMContentLoaded",()=>{
 const header=document.querySelector(".site-header");if(!header)return;
 const wrap=document.createElement("div");wrap.className="api-settings";
 wrap.innerHTML='<button type="button" class="api-trigger" id="apiTrigger">AI Settings</button><div class="api-popover" id="apiPopover"><div class="api-title">Gemini API key</div><p>Stored only in this browser session. Never commit your key to GitHub.</p><div class="api-row"><input id="apiKeyInput" type="password" autocomplete="off" placeholder="Paste your Gemini API key"><button id="apiSave" type="button">Save</button></div><button id="apiClear" class="api-clear" type="button">Clear session key</button><a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a Gemini key ↗</a></div>';
 header.appendChild(wrap);
 const pop=document.getElementById("apiPopover"),input=document.getElementById("apiKeyInput");
 input.value=AIStudyLab.getApiKey();
 document.getElementById("apiTrigger").textContent=AIStudyLab.getApiKey()?"AI Ready":"AI Settings";
 document.getElementById("apiTrigger").onclick=()=>pop.classList.toggle("open");
 document.getElementById("apiSave").onclick=()=>{if(!input.value.trim()){input.focus();return}AIStudyLab.setApiKey(input.value);pop.classList.remove("open");document.getElementById("apiTrigger").textContent="AI Ready"};
 document.getElementById("apiClear").onclick=()=>{AIStudyLab.clearApiKey();input.value="";document.getElementById("apiTrigger").textContent="AI Settings"};
 document.addEventListener("click",e=>{if(!wrap.contains(e.target))pop.classList.remove("open")});
});