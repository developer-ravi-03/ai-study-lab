const GEMINI_MODEL="gemini-3.8-flash";
const GEMINI_URL="https://generativelanguage.googleapis.com/v1beta/models/"+GEMINI_MODEL+":generateContent";
window.AIStudyLab=window.AIStudyLab||{};
AIStudyLab.getApiKey=()=>sessionStorage.getItem("gemini_api_key")||"";
AIStudyLab.setApiKey=k=>sessionStorage.setItem("gemini_api_key",k.trim());
AIStudyLab.clearApiKey=()=>sessionStorage.removeItem("gemini_api_key");
AIStudyLab.escapeHtml=v=>{const d=document.createElement("div");d.textContent=String(v??"");return d.innerHTML};
AIStudyLab.generate=async(prompt,{json=false}={})=>{
 const key=AIStudyLab.getApiKey();
 if(!key) throw new Error("Add your Gemini API key from AI Settings first.");
 const body={contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.35,maxOutputTokens:5000}};
 if(json) body.generationConfig.responseMimeType="application/json";
 const res=await fetch(GEMINI_URL,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify(body)});
 const data=await res.json();
 if(!res.ok) throw new Error(data?.error?.message||"Gemini request failed.");
 return data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";
};
document.addEventListener("DOMContentLoaded",()=>{
 const header=document.querySelector(".site-header"); if(!header)return;
 const wrap=document.createElement("div"); wrap.className="api-settings";
 wrap.innerHTML='<button type="button" class="api-trigger" id="apiTrigger">AI Settings</button><div class="api-popover" id="apiPopover"><div class="api-title">Gemini API key</div><p>Used only in this browser session and never included in the downloaded result.</p><div class="api-row"><input id="apiKeyInput" type="password" placeholder="Paste your Gemini API key"><button id="apiSave" type="button">Save</button></div><button id="apiClear" class="api-clear" type="button">Clear session key</button><a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a Gemini key ↗</a></div>';
 header.appendChild(wrap);
 const pop=document.getElementById("apiPopover"), input=document.getElementById("apiKeyInput");
 input.value=AIStudyLab.getApiKey();
 document.getElementById("apiTrigger").onclick=()=>pop.classList.toggle("open");
 document.getElementById("apiSave").onclick=()=>{if(!input.value.trim()){input.focus();return}AIStudyLab.setApiKey(input.value);pop.classList.remove("open");document.getElementById("apiTrigger").textContent="AI Ready"};
 document.getElementById("apiClear").onclick=()=>{AIStudyLab.clearApiKey();input.value="";document.getElementById("apiTrigger").textContent="AI Settings"};
});