let ACCESS_TOKEN, MY_ID;
try {
  ACCESS_TOKEN = JSON.parse(localStorage.accessToken).data;
} catch (e) {
  console.warn("Sololearn Backup: Access Token not found");
  alert("Sololearn Backup: Access Token not found. Please login to Sololearn or reload and try again");
}
try {
  MY_ID = JSON.parse(localStorage.user).data.id;
} catch (e) {
  console.warn("Sololearn Backup: User Not Logged in");
}
let filesystem = {};
let kill = false;
let stats = {
  fetched: 0,
  total: 0,
  message: "",
}

const fileMap = {
  "py": "main.py",
  "java": "Main.java",
  "cpp": "main.cpp",
  "cs": "Program.cs",
  "ts": "index.ts",
  "kt": "Main.kt",
  "php": "index.php",
  "swift": "main.swift",
  "c": "main.c",
  "node": "index.js",
  "go": "main.go",
  "r": "main.r",
  "rb": "main.rb",
};

async function getCode(publicId) {
  const res = await fetch(`https://api2.sololearn.com/v2/codeplayground/usercodes/${publicId}`, {
    "headers": {
      "authorization": "Bearer " + ACCESS_TOKEN,
    },
    "body": null,
    "method": "GET",
  });
  const data = (await res.json()).data;
  let code = {
    metadata: {
      createdDate: data.createdDate,
      name: data.name,
      id: data.id,
      publicId: data.publicId,
      isPublic: data.isPublic,
      language: data.language,
      votes: data.votes,
    },
    files: [],
    directory: data.name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_"),
  }
  code.files.push({
    name: "metadata.json",
    content: JSON.stringify(code.metadata, null, 2)
  });

  if ((!data.cssCode && !data.jsCode) || (data.cssCode == "" && data.jsCode == "")) {
    code.files.push({
      name: fileMap[data.language],
      content: data.sourceCode,
    });
  } else {
    code.files.push({
      name: "index.html",
      content: data.sourceCode.replace("</body>", '\t<link rel="stylesheet" href="style.css">\n\t<script src="script.js"></script>\n</body>'),
    });
    code.files.push({
      name: "style.css",
      content: data.cssCode,
    });
    code.files.push({
      name: "script.js",
      content: data.jsCode,
    });
  }
  return code;
}

async function getCodes(id) {
  id = id || MY_ID;
  let res = await fetch(`https://api2.sololearn.com/v2/userinfo/v3/profile/${id}?sections=8`, {
    "headers": {
      "authorization": "Bearer " + ACCESS_TOKEN,
    },
    "body": null,
    "method": "GET",
  });
  let codes = (await res.json()).userCodes.map(c => c.publicId);
  return codes;
}

async function fetchCodes(id, toKill = false) {
  setProgressText("Gathering information about your codes");
  let codeIds = await getCodes(id);
  stats.total = codeIds.length;
  setProgress(0, stats.total);
  setProgressText("Starting Fetch...")
  for (let i = 0; i < codeIds.length; i++) {
    if (toKill) break;
    let code = await getCode(codeIds[i]);
    let n = 0;
    let suff = "";
    while (filesystem[code.directory.toLowerCase() + suff]) {
      suff = ` (${++n})`;
    }
    code.directory += suff;
    filesystem[code.directory.toLowerCase()] = code.files;
    setProgress(++stats.fetched, stats.total);
    setProgressText(`Fetched ${stats.fetched} out of ${stats.total} codes`);
  }
  console.log(filesystem);
  return filesystem;
}
async function archive(filesys) {
  setProgressText("Archiving your codes")
  var zip = new JSZip();
  Object.keys(filesys).forEach(dir => {
    filesys[dir].forEach(file => {
      zip.file(`${dir}/${file.name}`, file.content);
    });
  });
  let file = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  });
  return file;
}

function setProgress(value, total, text) {
  if (!document.getElementById("export-progress")) return;
  let progress = document.getElementById("export-progress");
  progress.style.setProperty("--value", `${(value / total) * 100}%`);
  setProgressText(text ? text : `Fetched ${value} out of ${total} codes`);
}

function setProgressText(text) {
  if (!document.querySelector(".sl-p-export-progress-bar__value")) return;
  document.querySelector(".sl-p-export-progress-bar__value").innerText = text;
}

let isButtonAdded = false;
async function main() {
  let regex = (/https?:\/\/(www\.)?sololearn\.com\/(.*\/)?profile\/([0-9]+)/gmi);
  let match = regex.exec(window.location.href);
  if (!match) return;
  let userid = match[3];

  let exportButton = document.createElement("BUTTON");
  exportButton.className = "sl-p-codes__export sol-button sol-button-primary sol-button-full sol-button-s";
  exportButton.type = "button";
  exportButton.setAttribute("sl-test-data", "button");
  exportButton.innerHTML = `<span>Export Codes</span><svg xmlns="http://www.w3.org/2000/svg" height="22" viewBox="0 -960 960 960" width="22"><path d="M480-342.022q-8.957 0-17.152-3.098-8.196-3.098-14.913-9.815L300.348-502.522q-13.435-13.435-13.055-31.826.381-18.392 13.055-31.826 13.674-13.674 32.326-14.055 18.652-.38 32.326 13.294l69.5 69.5V-762.63q0-19.153 13.174-32.327T480-808.131q19.152 0 32.326 13.174T525.5-762.63v265.195l69.5-69.5q13.435-13.674 32.087-13.413 18.652.261 32.326 13.935 12.913 13.673 13.294 31.945.38 18.272-13.294 31.946L512.065-354.935q-6.717 6.717-14.913 9.815-8.195 3.098-17.152 3.098ZM242.87-151.869q-37.783 0-64.392-26.609-26.609-26.609-26.609-64.392v-74.5q0-19.152 13.174-32.326t32.327-13.174q19.152 0 32.326 13.174t13.174 32.326v74.5h474.26v-74.5q0-19.152 13.174-32.326t32.326-13.174q19.153 0 32.327 13.174t13.174 32.326v74.5q0 37.783-26.609 64.392-26.609 26.609-64.392 26.609H242.87Z"></path></svg>`;
  var loadTimer = setInterval(loadChecker, 121);
  function loadChecker() {
    if (document.querySelector(".sl-p-codes") && !isButtonAdded) {
      clearInterval(loadTimer);
      document.querySelector(".sl-p-codes").appendChild(exportButton);
      isButtonAdded = true;
    }
  }

  exportButton.addEventListener("click", async () => {
    let html = `
  <div class="sl-modal sl-p-modal">
    <div class="sl-modal__container sl-p-modal">
      <div class="sl-modal__content sl-p-modal">
        <div class="sl-p-export-progress">
          <div class="sl-p-export-progress__header">
            <h3 class="sl-p-export-progress__title">Exporting Codes</h3>
          </div>
          <div class="sl-p-export-progress-body" align="center">
            <p>Sit back and relax while we export your codes 😸. This may take a few minutes. </p>
            <!-- PROGRESS BAR -->
            <div class="sl-p-export-progress-bar" id="export-progress" data-value="40%"></div>
            <label for="export-progress">
              <!-- PROGRESS VALUE -->
              <span class="sl-p-export-progress-bar__value">Gathering information about your codes</span>
              <!-- PROGRESS VALUE -->
            </label>
            <!-- PROGRESS BAR -->
            <div class="sl-p-export-progress-body__footer">
              <button class="sl-p-export-progress-body__cancel-btn sol-button sol-button-primary sol-button-block sol-button-s">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");
    modal = doc.querySelector(".sl-modal");
    doc.querySelector(".sl-p-export-progress-body__cancel-btn").addEventListener("click", () => {
      modal.remove();
      kill = true;
    });
    document.querySelector(".sl-profile").appendChild(modal);
    // start fetching
    kill = false;
    let filesys = await fetchCodes(userid, kill);
    if (kill) {
      setProgressText("Cancelled");
      return;
    }
    let file = await archive(filesys);
    setProgressText("Download will start shortly");
    saveAs(file, `sololearn-${userid}.zip`);
    document.querySelector(".sl-p-export-progress-body__cancel-btn").innerText = "Done";
  });
}
addEventListener("load", main, false);