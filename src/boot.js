/* ---------- FOOT & BOOT ---------- */
const SOURCES='<p class="body">UCL outlet hours and addresses: the printed Food at UCL guide 2026/27 and the Food at UCL app.</p><p class="body">Chain prices: menus photographed in store (Pret, itsu, GAIL’s, Leon, Tortilla, Wasabi, atis, Costa) and UK price trackers, Oct 2026, takeaway. Sitting in can cost more.</p><p class="body">Meal deals: national press, Aug 2025. Shop addresses: store locators, Oct 2026.</p><p class="body">What students teach Fiver shows up for everyone nearby. Prices can change: check the board.</p><p class="body">Walking at 80 m/min; 6 minutes to eat on the go, 12 to sit down.</p><p class="body">Allergens change: always ask staff.</p>';
document.getElementById("foot").innerHTML='<div class="installBox"></div>';
window.__fiver={state,render,rank,selectedTime,unlock,S,openMenu,openTeach,todayDeals,cardUnlocks,UI,addCrumbs,rankName,nameMatch,teachCount,photonRows,shared,loadShared,sharedPlace,ON_SITE,DEVICE_ID,DEMO,MOMENTS,moment,pickMoment,ART,ARTW,UNIS,UNI_LIST,uniPlaces,allPlaces,persist,openSheet,msRender,cardsFor,footText,isOpen,hoursLabel,metres,startAgain,areaName,openInstallSheet,rankName,looseJSON};
render();
setTimeout(()=>{if(typeof loadLondon==="function")loadLondon();},600); // every London branch: after the first screen, never before
(async()=>{try{if(window.claude&&claude.use){sampleFn=await claude.use("sample");}}catch(e){sampleFn=null;}if(state.step>=S.where)render();})();

