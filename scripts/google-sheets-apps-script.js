/**
 * INTELLETTO-26 — Google Sheets Sync Webhook Script
 * Target Spreadsheet: https://docs.google.com/spreadsheets/d/1YNq_7hz2QUfI0XkadtZlS_nWfR3_ThKgeJBW2Ohl72U/edit
 *
 * HOW TO SET THIS UP (Takes 1 minute):
 * 1. Open your Google Sheet in browser:
 *    https://docs.google.com/spreadsheets/d/1YNq_7hz2QUfI0XkadtZlS_nWfR3_ThKgeJBW2Ohl72U/edit
 * 2. Click "Extensions" from the top menu -> Click "Apps Script".
 * 3. Delete any default code in Code.gs and paste this ENTIRE file into the editor.
 * 4. Click the disk "Save" icon (or Ctrl+S).
 * 5. Click the blue "Deploy" button (top right) -> Select "New deployment".
 * 6. Click the gear icon beside "Select type" and choose "Web app".
 * 7. Set the fields:
 *    - Description: Intelletto 26 Registration Sync
 *    - Execute as: Me (<your google email>)
 *    - Who has access: Anyone
 * 8. Click "Deploy".
 * 9. Click "Authorize access" and allow permissions for your sheet.
 * 10. Copy the generated "Web app URL" (looks like: https://script.google.com/macros/s/AKfycb.../exec).
 * 11. Paste that URL into your .env file:
 *     GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Auto-create styled header row if sheet is currently empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp",
        "Player Tag",
        "Full Name",
        "Email",
        "Phone",
        "Alternate Phone",
        "College",
        "Department",
        "Year of Study",
        "City",
        "State",
        "Emergency Contact",
        "Selected Events",
        "Team Name",
        "Team Size",
        "Teammates",
        "Payment Status",
        "Transaction ID(s)",
        "UPI ID(s)",
        "Payment Proof Name(s)"
      ];

      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setFontSize(10);
      headerRange.setBackground("#0F172A"); // Sleek dark slate
      headerRange.setFontColor("#F8FAFC");  // Ivory text
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    var rowValues = [
      data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.player_tag || "",
      data.full_name || "",
      data.email || "",
      data.phone || "",
      data.alternate_phone || "",
      data.college || "",
      data.department || "",
      data.year_of_study || "",
      data.city || "",
      data.state || "",
      data.emergency_contact || "",
      data.events || "",
      data.team_name || "",
      data.team_size || "",
      data.teammates || "",
      data.status || "confirmed",
      data.transaction_ids || "",
      data.upi_ids || "",
      data.proof_names || ""
    ];

    sheet.appendRow(rowValues);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Registration recorded successfully in Google Sheet",
      player_tag: data.player_tag
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    sheet: "INTELLETTO-26 Registrations",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
