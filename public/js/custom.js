function enablePopovers() {
  var popoverTargets = document.querySelectorAll("[data-content]");

  Array.from(popoverTargets).map(
    popTarget => new BSN.Popover(popTarget, {
      placement: "right",
      animation: "show",
      delay: 100,
      dismissible: true,
      trigger: "click"
    })
  );
}
enablePopovers();

var convertBtn=document.getElementById("convertBtn");
var importBtn=document.getElementById("importBtn");
var loadSampleBtn=document.getElementById("loadSampleBtn");
var saveSymbolsBtn=document.getElementById("saveSymbolsBtn");

var results=[];

function deepCopyObj(obj) {
  let resultObj={};
  for(let o in obj) {
    resultObj[o]=obj[o];
  }
  return resultObj;
}

function replaceAll(input,searchStr,replaceStr) {
  input=input.split(searchStr);
  input=input.join(replaceStr);
  return input;
}

function generateUid() {
  let result="";
  let str=replaceAll(uuid.bin().toString(),",","-");
  for(let i in str) {
    if(i%2==0) {
      result+="x";
    } else {
      result+=str[i];
    }
  }
  return "icon-"+result;
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

        convert(filename,filecontent);
        readFile(index+1);
      };
      fileReader.readAsBinaryString(file);
    }
    readFile(0);
  }
};


function convert(fileName,svgCode) {
  var url = "/api/convert-to-symbol";
  var paramsObj = {
    svgData: svgCode
  };
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      elaborateResult(this.response,fileName);
    } else if(this.readyState == 4) {
      console.log("Error");
    }
  };
  xhttp.open("POST", url, true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(paramsObj));
}

function elaborateResult(response,fileName) {
  response=JSON.parse(response);
  let symbol=response["symbol"];
  let input=response["input"];
  let uuid = (fileName==null) ? generateUid() : fileName;
  let svg = input;
  
  let data = {
    symbol: null,
    icon: null,
    htmlExample: null
  };
  let rawSymbolCode=symbol;
  rawSymbolCode=rawSymbolCode.replace("<symbol ", "<symbol id=\""+uuid+"\" ").replace(/<title>.*<\/title>\s/, "");

  let icon = "<svg class=\"icon "+uuid+"\">";
  icon+="<use xlink:href=\"#"+uuid+"\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"></use>";
  icon+="</svg>";

  let symbolCode = rawSymbolCode.split("\n");
  symbolCode.shift();
  symbolCode.pop();
  symbolCode = symbolCode.join("\n ");

  data.symbol = symbol;
  data.icon = icon;
  data.symbolCode=symbolCode;

  let compiledSamples = deepCopyObj(data);

  let now=new Date();
  let year=now.getFullYear();
  let month=now.getMonth();
  let days=now.getDate();

  let datestamp=year+ "-" +(month>=10 ? month : "0"+month) +"-"+ (days>=10 ? days : "0"+days);

  let hours=now.getHours();
  let minutes=now.getMinutes();
  let seconds=now.getSeconds();

  let timing=(hours>=10 ? hours : "0"+hours)+":"+(minutes>=10 ? minutes : "0"+minutes)+":"+(seconds>=10 ? seconds : "0"+seconds);

  // display results to users properly
  results.unshift({
    svg: svg,
    symbol: compiledSamples.symbol,
    icon: compiledSamples.icon,
    symbolCode: compiledSamples.symbolCode,
    timestamp: datestamp + " " + timing,
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

function renderThumbnail(result,index) {
  let htmlStr="";
  htmlStr+="<div id='thumbnail_"+index+"' class='col-xs-6 col-md-3'>";
  htmlStr+="<svg class=\"svg_symbol_defs\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">";
  htmlStr+="<defs>";
  htmlStr+=result.symbolCode;
  htmlStr+="</defs>";
  htmlStr+="</svg>";
  htmlStr+="<span class='btn btn-link' style='text-decoration:none;cursor:default'><small>Created at: " + result.timestamp +"</small>";

  htmlStr+="<a class='thumbnail'>";
  htmlStr+="<button class='btn btn-xs btn-danger rounded-circle pull-right' onclick='deleteItemFromResults("+index+")'>×</button>";
  htmlStr+="<div class='icon'>";
  htmlStr+=result.icon;
  htmlStr+="</div>";
  htmlStr+="<button type=\"button\" class=\"btn btn-link\" data-toggle=\"popover\" data-title=\"Code Preview: <kbd>" + result.name + "</kbd>\" data-dismissible=\"true\" data-placement=\"right\" data-content='<div class=\"row\">";
  htmlStr+="<div class=\"col-sm-12\">";
  htmlStr+="<h4><b><small>Symbol Definition(s)</small></b></h4>";
  htmlStr+="<textarea class=\"code\" rows=\"5\" disabled>";
  htmlStr+=result.symbolCode;
  htmlStr+="</textarea>";
  htmlStr+="</div>";
  htmlStr+="</div>";
  htmlStr+="<div class=\"row\">";
  htmlStr+="<div class=\"col-sm-12\">";
  htmlStr+="<h4><b><small>HTML(SVG(Use))</small></b></h4>";
  htmlStr+="<textarea class=\"code\" rows=\"2\" disabled>";
  htmlStr+=result.icon;
  htmlStr+="</textarea>";
  htmlStr+="</div>";
  htmlStr+="</div>'>";
  htmlStr+="<svg class=\"icon icon-code\"><use xlink:href=\"img/symbol-defs.svg#icon-code\"></use></svg> View Code";
  htmlStr+="</button>";
  htmlStr+="</div>";
  htmlStr+="</a>";

  return htmlStr;
}

function loadSample() {
  let str="";
  str+="<svg viewBox=\"0 0 32 32\">";
  str+="\r\t<path d=\"M27.429 4v20q0 0.893-0.607 1.589t-1.536 1.080-1.848 0.571-1.723 0.188-1.723-0.188-1.848-0.571-1.536-1.080-0.607-1.589 0.607-1.589 1.536-1.080 1.848-0.571 1.723-0.188q1.875 0 3.429 0.696v-9.589l-13.714 4.232v12.661q0 0.893-0.607 1.589t-1.536 1.080-1.848 0.571-1.723 0.188-1.723-0.188-1.848-0.571-1.536-1.080-0.607-1.589 0.607-1.589 1.536-1.080 1.848-0.571 1.723-0.188q1.875 0 3.429 0.696v-17.268q0-0.554 0.339-1.009t0.875-0.634l14.857-4.571q0.214-0.071 0.5-0.071 0.714 0 1.214 0.5t0.5 1.214z\"></path>";
  str+="\r</svg>";

  convert("icon-music", str);
}

function getSVGDefsToSave() {
  var svg_defs_to_save="";
  svg_defs_to_save+="<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">";
  svg_defs_to_save+="\r\t<defs>";

  for(var r in results) {
    var result=results[r];
    var symbolNode=result.symbolCode.replaceAll("xmlns=\"http://www.w3.org/2000/svg\"","");
    svg_defs_to_save+="\r\t\t"+symbolNode;
  }

  svg_defs_to_save+="\r\t</defs>";
  svg_defs_to_save+="\r</svg>";

  if (!window.Blob) {
    alert("Your browser does not support HTML5 'Blob' function required to save a file.");
  } else {
    let textblob = new Blob([svg_defs_to_save], {
        type: "image/svg+xml"
    });
    let dwnlnk = document.createElement("a");
    dwnlnk.download = "symbol-defs.svg";
    dwnlnk.innerHTML = "Download File";
    dwnlnk.href = window.URL.createObjectURL(textblob);
    dwnlnk.style.display = "none";
    document.body.appendChild(dwnlnk);

    dwnlnk.click();
  }
}