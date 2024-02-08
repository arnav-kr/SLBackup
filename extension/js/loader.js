let css = document.createElement("link");
css.href = chrome.runtime.getURL("css/content.css");
css.type = "text/css";
css.rel = "stylesheet";

let lib1 = document.createElement("script");
lib1.src = chrome.runtime.getURL("js/jszip.js");
lib1.type = "text/javascript";

let lib2 = document.createElement("script");
lib2.src = chrome.runtime.getURL("js/FileSaver.js");
lib2.type = "text/javascript";

let script = document.createElement("script");
script.src = chrome.runtime.getURL("js/content.js");
script.type = "text/javascript";
script.defer = true;

document.head.appendChild(css);
document.head.appendChild(lib1);
document.head.appendChild(lib2);
document.head.appendChild(script);