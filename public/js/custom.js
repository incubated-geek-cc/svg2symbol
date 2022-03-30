function enablePopovers() {
  var popoverTargets = document.querySelectorAll('[data-content]');

  Array.from(popoverTargets).map(
    popTarget => new BSN.Popover(popTarget, {
      placement: 'right',
      animation: 'show',
      delay: 100,
      dismissible: true,
      trigger: 'click'
    })
  );
}
enablePopovers();

var yearDisplay=document.getElementById("yearDisplay");
var convertBtn=document.getElementById("convertBtn");
var importBtn=document.getElementById("importBtn");
var loadSampleBtn=document.getElementById("loadSampleBtn");
var saveSymbolsBtn=document.getElementById("saveSymbolsBtn");

var results=[];

function generateTimestamp() {
  let now=new Date();
  let year=now.getFullYear();
  let month=now.getMonth();
  let days=now.getDate();
  let datestamp=year+ "-" +(month>=10 ? month : "0"+month) +"-"+ (days>=10 ? days : "0"+days);

  let hours=now.getHours();
  let minutes=now.getMinutes();
  let seconds=now.getSeconds();
  let timing=(hours>=10 ? hours : "0"+hours)+":"+(minutes>=10 ? minutes : "0"+minutes)+":"+(seconds>=10 ? seconds : "0"+seconds);

  return (datestamp+" "+timing);
}
yearDisplay.innerHTML=generateTimestamp();

function replaceAll(input,searchStr,replaceStr) {
  input=input.split(searchStr);
  input=input.join(replaceStr);
  return input;
}

function importFile() {
  importBtn.click();
}

importBtn.onclick = function(e) {
  e.target.value = "";
};

importBtn.onchange = function(e) {
  readMultiFiles(this.files);
}; // new file input

function readMultiFiles(files) {
 if (!window.FileReader) {
    alert("Your browser does not support HTML5 'FileReader' function required to open a file.");
  } else {
    var fileReader = new FileReader();
    function readFile(index) {
      if(index >= files.length) {
        return;
      }
      var file = files[index];
      fileReader.onload = function(e) {
        var filename=file.name;
        var n = filename.lastIndexOf(".");
        filename = filename.substring(0,n);

        var filecontent=e.target.result;

        convert(filename,filecontent,null);
        readFile(index+1);
      };
      fileReader.readAsBinaryString(file);
    }
    readFile(0);
  }
};


function convert(fileName,svgCode,iconTimestamp) {
  var url = "/api/convert-to-symbol";
  var paramsObj = {
    svgData: svgCode
  };
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      elaborateResult(this.response,fileName,iconTimestamp);
    } else if(this.readyState == 4) {
      console.log("Error");
    }
  };
  xhttp.open("POST", url, true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(paramsObj));
}

function elaborateResult(response,fileName,iconTimestamp) {
  if(fileName.substring(0,5) !== "icon-") {
    fileName="icon-"+fileName;
  }

  response=JSON.parse(response);
  let symbol=response["symbol"];
  let input=response["input"];
  let uuid = fileName;
  let svg = input;
  
  let data = {
    symbol: null,
    icon: null,
    symbolCode: null
  };
  let rawSymbolCode=symbol;
  rawSymbolCode=rawSymbolCode.replace("<symbol ", "<symbol id=\""+uuid+"\" ").replace(/<title>.*<\/title>\s/, "");

  let icon = "<svg class=\"icon "+uuid+"\">";
  icon+="<use xlink:href=\"#"+uuid+"\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"></use>";
  icon+="</svg>";

  let symbolCode = rawSymbolCode.split("\n");
  symbolCode.shift();
  symbolCode.pop();
  symbolCode = symbolCode.join("\n  ");

  data.symbol = symbol;
  data.icon = icon;
  data.symbolCode=symbolCode;

  let compiledSamples = JSON.parse(JSON.stringify(data));

  // display results to users properly
  results.unshift({
    svg: svg,
    symbol: compiledSamples.symbol,
    icon: compiledSamples.icon,
    symbolCode: compiledSamples.symbolCode,
    timestamp: (iconTimestamp==null) ? ("<svg style=\"background:transparent;display:inline-block;height:1em;padding:0;margin:0;fill:#7E18A7\" viewBox=\"0 0 32 32\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M16 9.714v8q0 0.25-0.161 0.411t-0.411 0.161h-5.714q-0.25 0-0.411-0.161t-0.161-0.411v-1.143q0-0.25 0.161-0.411t0.411-0.161h4v-6.286q0-0.25 0.161-0.411t0.411-0.161h1.143q0.25 0 0.411 0.161t0.161 0.411zM23.429 16q0-2.643-1.304-4.875t-3.536-3.536-4.875-1.304-4.875 1.304-3.536 3.536-1.304 4.875 1.304 4.875 3.536 3.536 4.875 1.304 4.875-1.304 3.536-3.536 1.304-4.875zM27.429 16q0 3.732-1.839 6.884t-4.991 4.991-6.884 1.839-6.884-1.839-4.991-4.991-1.839-6.884 1.839-6.884 4.991-4.991 6.884-1.839 6.884 1.839 4.991 4.991 1.839 6.884z\"></path></svg> "+generateTimestamp()) : iconTimestamp,
    name: uuid
  });

  let htmlStr="";
  for(let r in results) {
    let result=results[r];
    htmlStr+=renderThumbnail(result,r);
    //htmlStr+=result.svg;
  }
  document.getElementById("results").innerHTML=htmlStr;

  checkResultsArray();
  enablePopovers();
}

function checkResultsArray() {
  let actualLength=results.reduce((acc,cv) =>(cv)? acc+1 : acc, 0);

  if(actualLength>0) {
    saveSymbolsBtn["style"]["display"]="inline-block";
  } else {
    saveSymbolsBtn["style"]["display"]="none";
  }
}

function deleteItemFromResults(index) {
  document.getElementById("thumbnail_"+index).remove();
  delete results[index];

  checkResultsArray();
}


function htmlSanitiser(input) {
  let entities={
    "/":"&sol;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&apos;",
    ".":"&period;",
    ":":"&colon;",
    "\\":"&bsol;",
    "&":"&amp;",
    "=":"&equals;",
    "+":"&plus;",
    "-":"&minus;",
    "#":"&num;",
    "%":"&percnt;"
  };
  let result=input;
  for(let e in entities) {
      result=result.replaceAll(e,entities[e]);
  }
  return result;
}

var correctLen=21;
function renderThumbnail(result,index) {
  let len=(result.timestamp).length;

  if(len<correctLen) {
    let padding=(0.0).toPrecision(correctLen-len+11);
    padding=padding.replaceAll("0","&nbsp;").replaceAll(".","&nbsp;");
    result.timestamp=result.timestamp+padding;
  }

  let symbolCodeHtmlStr=result.symbolCode;
  symbolCodeHtmlStr=htmlSanitiser(symbolCodeHtmlStr);
  symbolCodeHtmlStr=symbolCodeHtmlStr.replaceAll("  &amp;lt;&amp;sol;symbol&amp;gt;","&amp;lt;&amp;sol;symbol&amp;gt;")
  symbolCodeHtmlStr=symbolCodeHtmlStr.replaceAll(" xmlns&equals;&amp;quot;http&amp;colon;&amp;sol;&amp;sol;www&amp;period;w3&amp;period;org&amp;sol;2000&amp;sol;svg&amp;quot;","");
  symbolCodeHtmlStr=symbolCodeHtmlStr.replaceAll("&amp;quot;&amp;sol;&amp;gt;","&amp;quot;&amp;gt;&amp;lt;&amp;sol;path&amp;gt;");
  // console.log(symbolCodeHtmlStr);
  symbolCodeHtmlStr="<pre><code>"+symbolCodeHtmlStr+"</code></pre>";

  let iconCodeHtmlStr=result.icon;
  iconCodeHtmlStr=iconCodeHtmlStr.replaceAll(" xmlns:xlink=\"http://www.w3.org/1999/xlink\"","");
  // console.log(iconCodeHtmlStr);
  iconCodeHtmlStr=htmlSanitiser(iconCodeHtmlStr);
  iconCodeHtmlStr="<pre><code>"+iconCodeHtmlStr+"</code></pre>";

  let htmlStr="";
  htmlStr+="<div id='thumbnail_"+index+"' class='col-xs-6 col-md-3 text-center'>";
  htmlStr+="<svg class=\"svg_symbol_defs\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">";
  htmlStr+="<defs>";
  htmlStr+=result.symbolCode;
  htmlStr+="</defs>";
  htmlStr+="</svg>";
  htmlStr+="<span class='btn btn-link thumbnail-title'>";
  htmlStr+= "<small>"+result.timestamp +"</small></span>";


  htmlStr+="<a class='thumbnail'>";
  htmlStr+="<button class='btn btn-xs btn-danger rounded-circle pull-right' onclick='deleteItemFromResults("+index+")'>×</button>";
  
  htmlStr+=result.icon;

  htmlStr+="<div>";
  htmlStr+="<button type=\"button\" class=\"btn btn-link\" data-toggle=\"popover\" data-title=\"Code Preview: <kbd>" + result.name + "</kbd>\" data-dismissible=\"true\" data-placement=\"right\" data-content='<div class=\"row\">";
  htmlStr+="<div class=\"col-sm-12\">";

  htmlStr+="<h4><b><small>Symbol Definition(s)</small></b></h4>";
  htmlStr+=symbolCodeHtmlStr;


  htmlStr+="</div>";
  htmlStr+="</div>";
  htmlStr+="<div class=\"row\">";
  htmlStr+="<div class=\"col-sm-12\">";
  htmlStr+="<h4><b><small>HTML(SVG(Use))</small></b></h4>";

  htmlStr+=iconCodeHtmlStr;

  htmlStr+="</div>";
  htmlStr+="</div>'>";
  htmlStr+="&lt;&sol;&gt; View Code";
  htmlStr+="</button>";
  htmlStr+="</div>";

  htmlStr+="</div>";
  htmlStr+="</a>";

  return htmlStr;
}

function loadSamples() {
  let samples={};

  let str="";
  str+="<svg viewBox=\"0 0 32 32\" xmlns=\"http://www.w3.org/2000/svg\">";
  str+="\r<path xmlns=\"http://www.w3.org/2000/svg\" d=\"M27.429 4v20q0 0.893-0.607 1.589t-1.536 1.080-1.848 0.571-1.723 0.188-1.723-0.188-1.848-0.571-1.536-1.080-0.607-1.589 0.607-1.589 1.536-1.080 1.848-0.571 1.723-0.188q1.875 0 3.429 0.696v-9.589l-13.714 4.232v12.661q0 0.893-0.607 1.589t-1.536 1.080-1.848 0.571-1.723 0.188-1.723-0.188-1.848-0.571-1.536-1.080-0.607-1.589 0.607-1.589 1.536-1.080 1.848-0.571 1.723-0.188q1.875 0 3.429 0.696v-17.268q0-0.554 0.339-1.009t0.875-0.634l14.857-4.571q0.214-0.071 0.5-0.071 0.714 0 1.214 0.5t0.5 1.214z\"></path>";
  str+="\r</svg>";
  samples["icon-music"]=str;

  str="";
  str+="<svg viewBox=\"0 0 32 32\" xmlns=\"http://www.w3.org/2000/svg\">";
  str+="\r<path xmlns=\"http://www.w3.org/2000/svg\" d=\"M14.537 0.313c-1.875 0.512-3.325 1.837-3.925 3.587-0.2 0.613-0.238 0.65-0.95 0.913-1.912 0.688-2.975 1.95-3.125 3.7-0.063 0.675-0.050 0.75 0.313 1.1 0.362 0.363 0.438 0.387 1.338 0.387 1.325 0 1.488-0.175 1.6-1.7 0.050-0.625 0.15-1.438 0.225-1.813l0.15-0.675 0.225 1.038c0.275 1.275 0.725 2.138 1.55 2.963 3.55 3.537 9.638 1.075 9.7-3.938v-0.688l0.188 0.5c0.1 0.275 0.262 1.175 0.35 2 0.075 0.825 0.2 1.588 0.25 1.675 0.163 0.25 0.887 0.512 1.462 0.512 1.15 0 1.712-0.613 1.575-1.75-0.2-1.688-1.25-2.838-3.25-3.563-0.688-0.25-0.762-0.313-0.962-0.837-1-2.625-3.975-4.15-6.713-3.413z\"></path>";
  str+="\r<path xmlns=\"http://www.w3.org/2000/svg\" d=\"M7.313 14.813c-1.575 1.413-3.050 2.75-3.275 2.988-0.563 0.613-0.663 1.375-0.275 2.163 0.4 0.8 0.962 1.163 1.8 1.163 0.813 0 1.088-0.175 3.162-2.025 1.338-1.212 1.525-1.337 1.525-1.063 0 0.175-0.787 1.663-1.762 3.363-0.975 1.663-1.8 3.113-1.825 3.188-0.050 0.125 0.35 0.163 1.763 0.163h1.825v2.712c0 2.387 0.037 2.788 0.238 3.238 0.475 1.063 1.7 1.45 2.75 0.9 0.95-0.5 1.012-0.725 1.012-3.938v-2.788h3.5v2.788c0 3.212 0.063 3.438 1.012 3.938 1.050 0.55 2.275 0.163 2.75-0.9 0.2-0.45 0.238-0.85 0.238-3.238v-2.712h1.825c1.425 0 1.813-0.038 1.762-0.163-0.025-0.087-0.85-1.525-1.825-3.212-0.962-1.675-1.762-3.188-1.762-3.35 0-0.25 0.212-0.1 1.538 1.075 2.063 1.85 2.337 2.025 3.15 2.025 0.825 0 1.387-0.363 1.788-1.125 0.325-0.625 0.313-1.425-0.038-1.95-0.1-0.15-1.587-1.525-3.313-3.037l-3.125-2.763-5.775 0.012h-5.787l-2.875 2.55z\"></path>";
  str+="\r</svg>";
  samples["icon-baby"]=str;

  str="";
  str+="<svg viewBox=\"0 0 32 32\" xmlns=\"http://www.w3.org/2000/svg\">";
  str+="\r<path xmlns=\"http://www.w3.org/2000/svg\" d=\"M29.839 10.107q0 0.714-0.5 1.214l-15.357 15.357q-0.5 0.5-1.214 0.5t-1.214-0.5l-8.893-8.893q-0.5-0.5-0.5-1.214t0.5-1.214l2.429-2.429q0.5-0.5 1.214-0.5t1.214 0.5l5.25 5.268 11.714-11.732q0.5-0.5 1.214-0.5t1.214 0.5l2.429 2.429q0.5 0.5 0.5 1.214z\"></path>";
  str+="\r</svg>";
  samples["icon-check"]=str;

  str="";
  str+="<svg viewBox=\"0 0 21 32\" xmlns=\"http://www.w3.org/2000/svg\">";
  str+="\r<path xmlns=\"http://www.w3.org/2000/svg\" d=\"M5.714 13.714h9.143v-3.429q0-1.893-1.339-3.232t-3.232-1.339-3.232 1.339-1.339 3.232v3.429zM20.571 15.429v10.286q0 0.714-0.5 1.214t-1.214 0.5h-17.143q-0.714 0-1.214-0.5t-0.5-1.214v-10.286q0-0.714 0.5-1.214t1.214-0.5h0.571v-3.429q0-3.286 2.357-5.643t5.643-2.357 5.643 2.357 2.357 5.643v3.429h0.571q0.714 0 1.214 0.5t0.5 1.214z\"></path>";
  str+="\r</svg>";
  samples["icon-lock"]=str;

  str="";
  str+="<svg viewBox=\"0 0 25 32\" xmlns=\"http://www.w3.org/2000/svg\">";
  str+="\r<path xmlns=\"http://www.w3.org/2000/svg\" d=\"M6.857 20.571v2.286h-2.286v-2.286h2.286zM6.857 6.857v2.286h-2.286v-2.286h2.286zM20.571 6.857v2.286h-2.286v-2.286h2.286zM2.286 25.125h6.857v-6.839h-6.857v6.839zM2.286 11.429h6.857v-6.857h-6.857v6.857zM16 11.429h6.857v-6.857h-6.857v6.857zM11.429 16v11.429h-11.429v-11.429h11.429zM20.571 25.143v2.286h-2.286v-2.286h2.286zM25.143 25.143v2.286h-2.286v-2.286h2.286zM25.143 16v6.857h-6.857v-2.286h-2.286v6.857h-2.286v-11.429h6.857v2.286h2.286v-2.286h2.286zM11.429 2.286v11.429h-11.429v-11.429h11.429zM25.143 2.286v11.429h-11.429v-11.429h11.429z\"></path>";
  str+="\r</svg>";
  samples["icon-qrcode"]=str;
  
  str="";
  str+="<svg viewBox=\"0 0 18 32\" xmlns=\"http://www.w3.org/2000/svg\">";
  str+="<path xmlns=\"http://www.w3.org/2000/svg\" d=\"M13.714 11.429q0-1.893-1.339-3.232t-3.232-1.339-3.232 1.339-1.339 3.232 1.339 3.232 3.232 1.339 3.232-1.339 1.339-3.232zM18.286 11.429q0 1.946-0.589 3.196l-6.5 13.821q-0.286 0.589-0.848 0.929t-1.205 0.339-1.205-0.339-0.83-0.929l-6.518-13.821q-0.589-1.25-0.589-3.196 0-3.786 2.679-6.464t6.464-2.679 6.464 2.679 2.679 6.464z\"></path>";
  str+="\r</svg>";
  samples["icon-map-marker"]=str;

  for(let s in samples) {
    convert(s,samples[s],"Sample Icon");
  }
}
loadSamples();

function generateSymbolDefsFile() { // File #1. symbol-defs.svg
  var symbol_defs_to_save="";
  symbol_defs_to_save+="<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">";
  symbol_defs_to_save+="\n\t<defs>";

  for(var r in results) {
    var result=results[r];
    var symbolNode=result.symbolCode;
    symbolNode=symbolNode.replaceAll("  </symbol>","\t\t</symbol>");
    symbolNode=symbolNode.replaceAll("/>","></path>");
    symbol_defs_to_save+="\n\t\t"+symbolNode;
  }
  symbol_defs_to_save+="\n\t</defs>";
  symbol_defs_to_save+="\n</svg>";
 
  
  // console.log(symbol_defs_to_save); 
  return symbol_defs_to_save;
}
function generateSvgUseJSFile() {
  let jsScript='!function(){"use strict";if(window&&window.addEventListener){var e,t,n=Object.create(null),o=function(){clearTimeout(t),t=setTimeout(e,100)},i=function(){},r=function(){var e;window.addEventListener("resize",o,!1),window.addEventListener("orientationchange",o,!1),window.MutationObserver?(e=new MutationObserver(o),e.observe(document.documentElement,{childList:!0,subtree:!0,attributes:!0}),i=function(){try{e.disconnect(),window.removeEventListener("resize",o,!1),window.removeEventListener("orientationchange",o,!1)}catch(t){}}):(document.documentElement.addEventListener("DOMSubtreeModified",o,!1),i=function(){document.documentElement.removeEventListener("DOMSubtreeModified",o,!1),window.removeEventListener("resize",o,!1),window.removeEventListener("orientationchange",o,!1)})},u=function(e){function t(e){var t;return void 0!==e.protocol?t=e:(t=document.createElement("a"),t.href=e),t.protocol.replace(/:/g,"")+t.host}var n,o,i;return window.XMLHttpRequest&&(n=new XMLHttpRequest,o=t(location),i=t(e),n=void 0===n.withCredentials&&""!==i&&i!==o?XDomainRequest||void 0:XMLHttpRequest),n},s="http://www.w3.org/1999/xlink";e=function(){function e(){L-=1,0===L&&(i(),r())}function t(e){return function(){n[e.base]!==!0&&(e.isXlink?e.useEl.setAttributeNS(s,"xlink:href","#"+e.hash):e.useEl.setAttribute("href","#"+e.hash))}}function o(t){return function(){var n,o=document.body,i=document.createElement("x");t.onload=null,i.innerHTML=t.responseText,n=i.getElementsByTagName("svg")[0],n&&(n.setAttribute("aria-hidden","true"),n.style.position="absolute",n.style.width=0,n.style.height=0,n.style.overflow="hidden",o.insertBefore(n,o.firstChild)),e()}}function d(t){return function(){t.onerror=null,t.ontimeout=null,e()}}var l,a,c,h,m,w,v,f,E,g,b="",L=0,p=!1;for(i(),E=document.getElementsByTagName("use"),m=0;m<E.length;m+=1){try{a=E[m].getBoundingClientRect()}catch(y){a=!1}h=E[m].getAttribute("href"),h?p=!1:(h=E[m].getAttributeNS(s,"href"),p=!0),f=h&&h.split?h.split("#"):["",""],l=f[0],c=f[1],w=a&&0===a.left&&0===a.right&&0===a.top&&0===a.bottom,a&&0===a.width&&0===a.height&&!w?(b&&!l.length&&c&&!document.getElementById(c)&&(l=b),l.length&&(g=n[l],g!==!0&&setTimeout(t({useEl:E[m],base:l,hash:c,isXlink:p}),0),void 0===g&&(v=u(l),void 0!==v&&(g=new v,n[l]=g,g.onload=o(g),g.onerror=d(g),g.ontimeout=d(g),g.open("GET",l),g.send(),L+=1)))):w?l.length&&n[l]&&setTimeout(t({useEl:E[m],base:l,hash:c,isXlink:p}),0):void 0===n[l]?n[l]=!0:n[l].onload&&(n[l].abort(),delete n[l].onload,n[l]=!0)}E="",L+=1,e()},window.addEventListener("load",function d(){window.removeEventListener("load",d,!1),t=setTimeout(e,0)},!1)}}();';

  return jsScript;  // File #2. svgxuse.min.js
}

function exportAllIcons() {
  var file_1_symbol_defs_to_save=generateSymbolDefsFile(); // symbol-defs.svg
  var file_2_svgxuse_min_js=generateSvgUseJSFile(); // svgxuse.min.js 

  var file_entities=[
    {
      "filetype":"image/svg+xml",
      "filename":"symbol-defs.svg",
      "filecontent":file_1_symbol_defs_to_save
    },
    {
      "filetype":"application/javascript",
      "filename":"svgxuse.min.js",
      "filecontent":file_2_svgxuse_min_js
    }
  ];
  
  if (!window.Blob) {
    alert("Your browser does not support HTML5 'Blob' function required to save a file.");
    return;
  } 

  for(var index in file_entities) {
    var file_entity=file_entities[index];
    var textblob = new Blob([file_entity["filecontent"]], {
        type: file_entity["filetype"]
    });
    var dwnlnk=document.createElement("a");
    dwnlnk.download=file_entity["filename"];
    dwnlnk.innerHTML="Download File";
    dwnlnk.href=window.URL.createObjectURL(textblob);
    dwnlnk.style.display="none";
    document.body.appendChild(dwnlnk);
    dwnlnk.click();
    setTimeout(function(e1) {
      dwnlnk.remove();
    },2000);
  }
}