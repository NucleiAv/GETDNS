let dnsData;
let dnsRecordTypes = {
  "1": "A",
  "2": "NS",
  "5": "CNAME",
  "6": "SOA",
  "15": "MX",
  "16": "TXT",
  "28": "AAAA",
  "33": "SRV"
};


document.addEventListener("DOMContentLoaded", function () {
  // initialize buttons
  const submitButton = document.getElementById("submit-button");
  submitButton.addEventListener("click", submitDig);

  // get and dig the current tab's domain
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let currentUrl = tabs[0].url;
    let parsedDomain = parseDomain(currentUrl);
    displayDomain(parsedDomain);
    quickCheck(parsedDomain);
  });
});

// Runs three queries and sends them to displayDnsData
async function quickCheck(domain) {
  let dnsResponses = [];
  dnsData = await dig(domain, "a");
  if (dnsData) { displayHelper(dnsResponses, dnsData) }
  dnsData = await dig(domain, "cname");
  if (dnsData) { displayHelper(dnsResponses, dnsData) };
  dnsData = await dig(domain, "ns");
  if (dnsData) { displayHelper(dnsResponses, dnsData) };
};

// Prevents displaying duplicate responses
function displayHelper(dnsResponses, dnsData) {
  for (let each in dnsData) {
    if (!dnsResponses.includes(dnsData[each].data)) {
      dnsResponses.push(dnsData[each].data)
      displayDnsData([dnsData[each]]);
    }
  };
  return;
};

// Parses the current tab's (sub)domain from the URL
function parseDomain(currentUrl) {
  const noScheme = currentUrl.replace(/https?:\/\//g, "");
  const parsedDomain = noScheme.replace(/\/.*/g, "");
  let recordNameField = document.getElementById("record-name");
  recordNameField.value = parsedDomain;
  return parsedDomain;
};

// Removes a subdomain
function getRoot(domain) {
  let rootDomain = domain;
  rootDomain = rootDomain.replace(/^([^\.]+)\.(?=[^\.]+\.[^\.]+$)/, "");
  return rootDomain;
}

// Retrieves DNS information
async function dig(name, type) {
  if (type == "ns") {
    name = getRoot(name);
  }
  let dnsAnswer;
  let response = await fetch(`https://dns.google/resolve?name=${name}&type=${type}`)
    .then(response => response.json())
    .then(data => { dnsAnswer = data["Answer"]; });
  return dnsAnswer;
};

// Handles the user-selected data type
async function submitDig(event) {
  event.preventDefault();
  const dataDisplayDiv = document.getElementById("results");
  dataDisplayDiv.innerHTML = "";
  const newRecordName = document.getElementById("record-name").value;
  const newRecordType = document.getElementById("record-type").value;
  let newData;
  displayDomain(newRecordName);
  if (newRecordType == "quickCheck") {
    quickCheck(newRecordName)
  } else {
    newData = await dig(newRecordName, newRecordType);
    displayDnsData(newData);
  };
};

// Print functions
function displayDomain(dnsName) {
  const dataDisplayDiv = document.getElementById("results");
  const dnsNameH2 = document.createElement("h2");
  const dnsNameText = document.createTextNode(`${dnsName}:`);
  dnsNameH2.appendChild(dnsNameText);
  dataDisplayDiv.appendChild(dnsNameH2);
};

function displayDnsData(dnsAnswer) {
  const dataDisplayDiv = document.getElementById("results");
  if (dnsAnswer == null) {
    const lineBreak1 = document.createElement("br");
    const noSuchRecordP = document.createElement("p");
    const noSuchRecordString = document.createTextNode("Record not found.");
    noSuchRecordP.appendChild(noSuchRecordString);
    noSuchRecordP.appendChild(lineBreak1);
    dataDisplayDiv.appendChild(noSuchRecordP);
    return;
  };

  for (let each in dnsAnswer) {
    const resultDiv = document.createElement("div");

    // construct Type text:
    const lineBreak1 = document.createElement("br");
    const resStringP = document.createElement("p");
    const resType = dnsAnswer[each]["type"];
    const resTypeString = document.createTextNode(`Type: ${dnsRecordTypes[resType]}`);
    resStringP.appendChild(resTypeString);
    resStringP.appendChild(lineBreak1);

    // construct Value text:
    const lineBreak2 = document.createElement("br");
    const resTtlString = document.createTextNode(`TTL: ${dnsAnswer[each]["TTL"]}`);
    resStringP.appendChild(resTtlString);
    resStringP.appendChild(lineBreak2);

    // construct Data text:
    const lineBreak3 = document.createElement("br");
    const resDataString = document.createTextNode(`Data: ${dnsAnswer[each]["data"]}`)
    resStringP.appendChild(resDataString);
    resStringP.appendChild(lineBreak3);

    // add all to result div:
    resultDiv.appendChild(resStringP);
    dataDisplayDiv.appendChild(resultDiv);
  };
};
