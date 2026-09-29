const SHEET_NAME = "Sheet1";
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
  const headers = values[0];
  const rows = values.slice(1).filter(r => r.some(v => v !== ""));
  const data = rows.map(row => Object.fromEntries(headers.map((h,i) => [String(h), row[i]])));
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const body = JSON.parse(e.postData.contents || "{}");
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  if (!headers.some(Boolean)) {
    const keys = Object.keys(body);
    sheet.getRange(1,1,1,keys.length).setValues([keys]);
    sheet.appendRow(keys.map(k => body[k] ?? ""));
  } else {
    sheet.appendRow(headers.map(h => body[h] ?? ""));
  }
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}