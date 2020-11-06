var inputSvgCode=document.getElementById("inputSvgCode");
var convertBtn=document.getElementById("convertBtn");
var importBtn=document.getElementById("importBtn");
var loadSampleBtn=document.getElementById("loadSampleBtn");

var results=[];

function deepCopyObj(obj) {
  var resultObj={};
  for(var o in obj) {
    resultObj[o]=obj[o];
  }
  return resultObj;
}

function generateUid() {
  var timestamp=new Date().getMilliseconds();
  var r = Math.random()*16 | 0;
  var v = (r & 0x3 | 0x8);
  v=v.toString(16);

  return "icon-"+timestamp+"xxxxxxxx".replace(/[xy]/g, v);
}

function importFile() {
  importBtn.click();
}

importBtn.onclick = function(e) {
  e.target.value = "";
};

importBtn.onchange = function(e) {
  let fileName = e.target.value;
  fileName = fileName.split("\\")[2];
  let n = fileName.lastIndexOf(".");
  fileName = fileName.substring(0,n);

  if (!window.FileReader) {
      alert("Your browser does not support HTML5 'FileReader' function required to open a file.");
  } else {
      var fileis = this.files[0];
      var fileredr = new FileReader();
      fileredr.onload = function (fle) {
        var filecont = fle.target.result;
        inputSvgCode.value = filecont;
        if(filecont.trim() != "") {
          convert();
        }
      };
      fileredr.readAsText(fileis);
  }
}; // new file input

function convert() {
  var url = "/api/convert-to-symbol";
  var paramsObj = {
    svgData: inputSvgCode.value
  };
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      elaborateResult(this.response);
    } else if(this.readyState == 4) {
      console.log("Error");
    }
  };
  xhttp.open("POST", url, true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(paramsObj));
}

function elaborateResult(response) {
  response=JSON.parse(response);
  var symbol=response["symbol"];
  var input=response["input"];

  var uuid = generateUid();

  var svg = input;
  // CALL buildHTML function 
  var data = {
    symbol: null,
    icon: null,
    htmlExample: null
  };
  var rawSymbolCode=symbol;
  rawSymbolCode=rawSymbolCode.replace("<symbol ", "<symbol id=\""+uuid+"\" ").replace(/<title>.*<\/title>\s/, "");

  var icon = "<svg class=\"icon "+uuid+"\">";2
  icon+="<use xlink:href=\"#"+uuid+"\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"></use>";
  icon+="</svg>";

  var symbolCode = rawSymbolCode.split("\n");
  symbolCode.shift();
  symbolCode.pop();
  symbolCode = symbolCode.join("\n ");

  data.symbol = symbol;
  data.icon = icon;
  data.symbolCode=symbolCode;

  var compiledSamples = deepCopyObj(data);

  var now=new Date();
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
    timestamp: datestamp + " " + timing
  });

  var htmlStr="";
  for(var r in results) {
    var result=results[r];

    var symbol=result.symbol;
    symbol=symbol.replace("<svg width=\"0\" height=\"0\" style=\"position:absolute\">","").replace("</svg>","");
    
    htmlStr+="<svg class=\"svg_symbol_defs\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">";
    htmlStr+=" <defs>";
    htmlStr+=result.symbolCode;
    htmlStr+=" </defs>";
    htmlStr+="</svg>";

    htmlStr+="<div class='panel col-sm-6'>";

    htmlStr+="<div class='panel-heading small'>";
    htmlStr+="<div class='row'>";
    htmlStr+="<div class='col-xs-6'><span class='btn btn-link'>Created at: " + result.timestamp +"</span></div>";
    htmlStr+="<div class='col-xs-6 text-right'></div>";
    htmlStr+="</div>"; // row
    htmlStr+="</div>"; // heading

    htmlStr+="<div class='panel-body'>";
    htmlStr+="<div class='row'>";
    htmlStr+="<div class='col-sm-6 text-center'>";
    htmlStr+="<label>";
    htmlStr+="Svg (your input)";
    htmlStr+="</label>";
    htmlStr+="<div class='icon'>";
    htmlStr+=result.svg;
    htmlStr+="</div>";
    htmlStr+="</div>";

    htmlStr+="<div class='col-sm-6 text-center'>";
    htmlStr+="<label>";
    htmlStr+="Svg (your converted to)";
    htmlStr+="</label>";
    htmlStr+="<div class='icon'>";
    htmlStr+=result.icon;
    htmlStr+="</div>";
    htmlStr+="</div>";
    htmlStr+="</div>"; // row
    htmlStr+="</div>"; // panel-body
     
    htmlStr+="<div class='panel-footer small'>";

    htmlStr+="<div class='row'>";
    htmlStr+="<div class='col-sm-12 text-left'>";
    htmlStr+="<span class='btn btn-link'>Code to be embedded: </span>";
    htmlStr+="</div>";
    htmlStr+="</div>";
    htmlStr+="<div class='row'>";
    htmlStr+="<div class='col-sm-12'>";
    htmlStr+="<textarea class='code' rows='7' disabled>";      
    htmlStr+=result.symbolCode;
    htmlStr+="</textarea>";
    htmlStr+="</div>";
    htmlStr+="</div>";

    htmlStr+="<div class='row'>";
    htmlStr+="<div class='col-sm-12 text-left'>";
    htmlStr+="<span class='btn btn-link'>Code to use in browser: </span>";
    htmlStr+="</div>";
    htmlStr+="</div>";
    htmlStr+="<div class='row'>";
    htmlStr+="<div class='col-sm-12'>";
    htmlStr+="<textarea class='code' rows='2' disabled>";
    htmlStr+=result.icon;
    htmlStr+="</textarea>";
    htmlStr+="</div>";
    htmlStr+="</div>";

    htmlStr+="</div>"; // footer
       
    htmlStr+="</div>"; // panel

    htmlStr+="</div>"; // col-sm-6
  }

  document.getElementById("results").innerHTML=htmlStr;
}


function loadSample() {
  let str="";
  str+="<svg viewBox=\"0 0 32 32\">";
  str+="<path d=\"M27.429 4v20q0 0.893-0.607 1.589t-1.536 1.080-1.848 0.571-1.723 0.188-1.723-0.188-1.848-0.571-1.536-1.080-0.607-1.589 0.607-1.589 1.536-1.080 1.848-0.571 1.723-0.188q1.875 0 3.429 0.696v-9.589l-13.714 4.232v12.661q0 0.893-0.607 1.589t-1.536 1.080-1.848 0.571-1.723 0.188-1.723-0.188-1.848-0.571-1.536-1.080-0.607-1.589 0.607-1.589 1.536-1.080 1.848-0.571 1.723-0.188q1.875 0 3.429 0.696v-17.268q0-0.554 0.339-1.009t0.875-0.634l14.857-4.571q0.214-0.071 0.5-0.071 0.714 0 1.214 0.5t0.5 1.214z\"></path>";
  str+="</svg>";
  inputSvgCode.value = str;

  convert();
}

  


/*
  $("#exportBtn").click(function(e) {
    if (!window.Blob) {
      alert("Your browser does not support HTML5 'Blob' function required to save a file.");
    } else {
      let textblob = new Blob([$("#geojson").text()], {
          type: "text/plain"
      });
      let dwnlnk = document.createElement("a");
      dwnlnk.download = "routes.geojson";
      dwnlnk.innerHTML = "Download File";
      if (window.webkitURL != null) {
          dwnlnk.href = window.webkitURL.createObjectURL(textblob);
      } else {
          dwnlnk.href = window.URL.createObjectURL(textblob);
          dwnlnk.onclick = destce;
          dwnlnk.style.display = "none";
          document.body.appendChild(dwnlnk);
      }
      dwnlnk.click();
    }
  });
*/