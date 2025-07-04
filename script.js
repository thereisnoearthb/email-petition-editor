document.addEventListener('DOMContentLoaded', () => {

  // Get non-empty, trimmed values from a collection of inputs
  function getValuesFromInputs(selector) {
    return Array.from(document.querySelectorAll(selector))
      .map(input => input.value.trim())
      .filter(value => value); // Remove empty values
  }

  // Add a new input group to a container
  function addInput(containerId, inputHtml) {
    const container = document.getElementById(containerId);
    if (container) {
      container.insertAdjacentHTML('beforeend', inputHtml);
    } else {
      console.error(`Container with ID ${containerId} not found.`);
    }
  }

  // Remove the closest parent '.input-group' of a button
  function removeInput(button) {
    const inputGroup = button.closest('.input-group');
    if (inputGroup) {
      inputGroup.remove();
    }
  }

  // Safely escape HTML for display purposes (used in generated file's preview)
  function escapeHtmlForDisplay(unsafe) {
    if (typeof unsafe !== 'string') return "";
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Trigger file download
  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up
  }

  // --- HTML Generation Function ---

  function generateHtmlContent(data) {
    // Use JSON.stringify for safe embedding of data into the script block
    // This handles quotes, newlines, etc. within the data correctly.
    const jsConstants = `
      const TO_ADDRESS = ${JSON.stringify(data.toAddresses.join(','))};
      const CC_ADDRESS = ${JSON.stringify(data.ccAddresses.join(','))};
      const BCC_ADDRESS = ${JSON.stringify(data.bccAddress)};
      const SUBJECT_LINES = ${JSON.stringify(data.subjectLines)};
      const PARA1_OPTIONS = ${JSON.stringify(data.para1Options)};
      const PARA2_OPTIONS = ${JSON.stringify(data.para2Options)};
      const PARA3_OPTIONS = ${JSON.stringify(data.para3Options)};
      const SIGNING_OFF_OPTIONS = ${JSON.stringify(data.signingOffOptions)};

      // --- Use actual newline characters internally for JS logic ---
      const LINE_BREAK = "\\n";
      const DOUBLE_LINE_BREAK = "\\n\\n";
    `;

    const jsLogic = `
      let mailtoLink = "";
      let copyText = ""; // Body only for preview/copy
      let selectedSubject = "";

      function getRandomElement(arr) {
        // Ensure arr is an array and not empty before accessing length
        if (!Array.isArray(arr) || arr.length === 0) return "";
        return arr[Math.floor(Math.random() * arr.length)];
      }

      function escapeHtmlForDisplay(unsafe) {
        if (typeof unsafe !== "string") return "";
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function prepareMail() {
        const sendLink = document.getElementById("send");

        try {
          selectedSubject = getRandomElement(SUBJECT_LINES);
          const selectedPara1 = getRandomElement(PARA1_OPTIONS);
          const selectedPara2 = getRandomElement(PARA2_OPTIONS);
          const selectedPara3 = getRandomElement(PARA3_OPTIONS);
          const selectedSignoff = getRandomElement(SIGNING_OFF_OPTIONS);

          // --- Construct body using actual newlines ---
          const bodyForMailto = [
            selectedPara1,
            selectedPara2,
            selectedPara3,
            selectedSignoff,
          ].filter(p => typeof p === 'string' && p.length > 0) // Filter out potential empty strings/undefined
           .join(DOUBLE_LINE_BREAK); // Join paragraphs with internal newlines

          // --- Construct mailto link (URLSearchParams will encode \\n correctly) ---
          const params = new URLSearchParams();
          // Only add params if they have a value
          if (CC_ADDRESS) params.append("cc", CC_ADDRESS);
          if (BCC_ADDRESS) params.append("bcc", BCC_ADDRESS);
          if (selectedSubject) params.append("subject", selectedSubject);
          if (bodyForMailto) params.append("body", bodyForMailto); // Let URLSearchParams handle encoding \n

          // Platform Specific Adjustments (Example for iOS if needed later)
          let finalQueryString = params.toString();
          finalQueryString = finalQueryString.replace(/\\+/g, '%20');

          // Platform Detection
					const userAgent = navigator.userAgent || navigator.vendor || window.opera;
					const platformNavigator = navigator.platform || ""; // For OS-level platform string

					let detectedSystem = "Unknown";
					let mailtoEncodingProfile = "standard"; // Profile to decide encoding: 'ios_specific' or 'standard'

					// iOS Detection Logic
					// 1. Check navigator.platform for direct iOS device strings (most reliable if available)
					if (/iPad|iPhone|iPod/.test(platformNavigator)) {
						detectedSystem = "iOS";
						mailtoEncodingProfile = "ios_specific";
					}
					// 2. Check userAgent for standard iOS device strings
					else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) { // !window.MSStream helps avoid some Windows Phone false positives
						detectedSystem = "iOS";
						mailtoEncodingProfile = "ios_specific";
					}
					// 3. Check for "Macintosh" + "Mobile" in userAgent (common for iPads in desktop mode/emulators)
					else if (/Macintosh/.test(userAgent) && /Mobile/.test(userAgent)) {
						detectedSystem = "iOS";
						mailtoEncodingProfile = "ios_specific";
					}
					// 4. Check for "Macintosh" userAgent with multi-touch capability (another iPad desktop mode/emulator indicator)
					else if (/Macintosh/.test(userAgent) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1) {
						detectedSystem = "iOS";
						mailtoEncodingProfile = "ios_specific";
					}
					// macOS Detection (ensure it's not an iPad already identified above)
					else if ((/Macintosh/.test(userAgent) || /MacIntel/.test(platformNavigator) || /MacPPC/.test(platformNavigator) || /Mac68K/.test(platformNavigator))) {
						detectedSystem = "macOS";
						mailtoEncodingProfile = "standard";
					}
					// Android Detection
					else if (/android/i.test(userAgent)) {
						detectedSystem = "Android";
						mailtoEncodingProfile = "standard"; // Android is generally robust
					}
					// Windows Detection
					else if (/Win/.test(platformNavigator)) {
						detectedSystem = "Windows";
						mailtoEncodingProfile = "standard";
					}
					// Linux Desktop Detection
					else if (/Linux/.test(platformNavigator) && !/android/i.test(userAgent)) { // Exclude Android's Linux
						detectedSystem = "Linux";
						mailtoEncodingProfile = "standard";
					}
					// If still "Unknown", it might be a less common OS. 'standard' is a safe default.
					console.log("Detected System:", detectedSystem);
					console.log("Using mailto encoding profile:", mailtoEncodingProfile);

					// Apply encoding adjustments based on the profile
					if (mailtoEncodingProfile === "ios_specific") {
						console.log("Applying iOS specific mailto link generation strategy.");
						finalQueryString = finalQueryString.replace(/%0A/g, '%0D%0A');
						console.log("iOS: Converted newlines from %0A to %0D%0A for better compatibility.");
					}
					
					else if (mailtoEncodingProfile === "standard") {
						console.log("Applying standard mailto link generation strategy for ", detectedSystem);
					}
					// finalQueryString is now potentially adjusted based on the platform.

					if(mailtoLink.length>1998)
						console.warn("mailto too long for Chrome: " + mailtoLink.length +" chars");
					else
						console.log("mailto length OK: "+ mailtoLink.length +" chars");

          if (TO_ADDRESS) {
             // Encode TO addresses individually, then join
             const encodedTo = TO_ADDRESS.split(",")
              .map(e => e.trim()) // Trim whitespace first
              .filter(e => e)     // Remove empty entries
              .map(e => encodeURIComponent(e)) // Then encode
              .join(",");

             if (encodedTo) { // Ensure there's at least one valid TO address after filtering/encoding
                mailtoLink = \`mailto:\${encodedTo}?\${finalQueryString}\`;
             } else {
                mailtoLink = ""; // No valid TO address
                console.error("No valid TO addresses provided after encoding.");
             }

          } else {
            mailtoLink = "";
            console.error("TO address constant is missing or empty.");
          }

          // --- Construct body text for preview/copy (plain text) ---
          copyText = [
              selectedPara1,
              selectedPara2,
              selectedPara3,
              selectedSignoff
          ].filter(p => typeof p === 'string' && p.length > 0)
           .join('\\n\\n');

          // --- Update preview elements safely ---
          const toElem = document.getElementById("preview-to");
          const ccElem = document.getElementById("preview-cc");
          const ccLine = document.getElementById("cc-line");
          const bccElem = document.getElementById("preview-bcc");
          const bccLine = document.getElementById("bcc-line");
          const subjectElem = document.getElementById("preview-subject");
          const previewElem = document.getElementById("email-preview");

          if (toElem) toElem.textContent = escapeHtmlForDisplay(TO_ADDRESS || '(Not specified)');
          if (ccElem && ccLine) {
              if (CC_ADDRESS) {
                  ccElem.textContent = escapeHtmlForDisplay(CC_ADDRESS);
                  ccLine.style.display = 'block';
              } else {
                  ccLine.style.display = 'none';
              }
          }
          if (bccElem && bccLine) {
              if (BCC_ADDRESS) {
                  bccElem.textContent = escapeHtmlForDisplay(BCC_ADDRESS);
                  bccLine.style.display = 'block';
              } else {
                  bccLine.style.display = 'none';
              }
          }
          // Display generated subject or placeholder
          if (subjectElem) subjectElem.textContent = escapeHtmlForDisplay(selectedSubject || '(No subject generated)');
          // Display generated body or placeholder
          if (previewElem) previewElem.textContent = copyText || '(No body content generated)';


          // --- Update the href of the anchor tag ---
          if (sendLink) {
            if (mailtoLink) {
              sendLink.href = mailtoLink;
              sendLink.classList.remove("disabled");
              sendLink.title = "Click to open in your default email client";
            } else {
              sendLink.href = "#"; // Prevent navigation
              sendLink.classList.add("disabled"); // Visually disable
              sendLink.title = "Cannot generate email link (check TO address and console errors)";
            }
          }
        } catch (err) {
          console.error("Error in prepareMail:", err);
          alert("An error occurred while preparing the email preview. Check console for details.");
          if (sendLink) {
            sendLink.href = "#";
            sendLink.classList.add("disabled");
            sendLink.title = "Error generating email link";
          }
        }
      }

      // --- Event Listeners within generated file ---
      document.addEventListener("DOMContentLoaded", () => {
        const copyButton = document.getElementById("copy");

        if (copyButton) {
          copyButton.addEventListener("click", () => {
            // Ensure content exists before trying to copy
            if (!copyText && !selectedSubject) {
              alert("Email content not generated yet. Please reload or check generator inputs.");
              return;
            }
            // Construct the full text including headers for copying
            const fullEmailText = \`To: \${TO_ADDRESS || ''}\\n\${
              CC_ADDRESS ? \`Cc: \${CC_ADDRESS}\\n\` : ""
            }\${
              BCC_ADDRESS ? \`Bcc: \${BCC_ADDRESS}\\n\` : ""
            }Subject: \${selectedSubject || ''}\\n\\n\${copyText || ''}\`;

            navigator.clipboard.writeText(fullEmailText)
              .then(() => {
                alert("Email content copied to clipboard!");
              })
              .catch(err => {
                console.warn("Clipboard API failed, trying fallback:", err);
                // Fallback using temporary textarea
                const textarea = document.createElement("textarea");
                textarea.value = fullEmailText;
                textarea.style.position = "fixed"; // Prevent scrolling issues
                textarea.style.opacity = "0"; // Hide it visually
                textarea.style.left = "-9999px"; // Move off-screen
                document.body.appendChild(textarea);
                textarea.select();
                try {
                  document.execCommand("copy");
                  alert("Email content copied (fallback)!");
                } catch (errFallback) {
                  console.error("Fallback copy failed:", errFallback);
                  alert("Failed to copy automatically. Please copy manually from the preview.");
                }
                document.body.removeChild(textarea);
              });
          });
        }

        // Initial preparation on load
        prepareMail();
      });
    `;

    // Construct the full HTML using template literals
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtmlForDisplay(data.pageTitle) || 'Email Petition'}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
    <style>
      body { background-color: white; color: black; padding-top: 1rem; padding-bottom: 1rem; }
      .container { max-width: 800px; }
      .btn-custom-primary { background-color: #2e4989; border-color: #2e4989; color: white; }
      .btn-custom-primary:hover, .btn-custom-primary:focus { background-color: #1e3a75; border-color: #1e3a75; color: white; }
      .btn-custom-secondary { background-color: #dfd3b9; border-color: #dfd3b9; color: black; }
      .btn-custom-secondary:hover, .btn-custom-secondary:focus { background-color: #c9bfa5; border-color: #c9bfa5; color: black; }
      .btn.disabled, .btn:disabled, fieldset:disabled .btn { pointer-events: none; opacity: 0.65; }
      .email-preview { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 1.5rem; margin-top: 1rem; border-radius: 0.375rem; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; max-height: 50vh; overflow-y: auto; }
      h5, h6 { color: #2e4989; }
      #email-details p { margin-bottom: 0.5rem; word-wrap: break-word; }
    </style>
</head>
<body>
    <div class="container">
      <h5 class="mb-3 text-center">Email Preview & Actions</h5>
      <p class="text-center text-muted small">Hover over "Send Mail" to see the link. If your email app doesn't open correctly, please use the copy button.</p>
      <div class="text-center mb-4">
        <a id="send" href="#" target="_blank" class="btn btn-custom-primary btn-lg me-2 disabled" role="button" title="Generating link...">
          <i class="bi bi-send"></i> Send Mail
        </a>
        <button id="copy" class="btn btn-custom-secondary me-2" type="button">
          <i class="bi bi-clipboard"></i> Copy Email Content
        </button>
      </div>
      <h6>Email Details:</h6>
      <div id="email-details" class="mb-3">
        <p><strong>To:</strong> <span id="preview-to">(Generating...)</span></p>
        <p id="cc-line" style="display: none;"><strong>Cc:</strong> <span id="preview-cc"></span></p>
        <p id="bcc-line" style="display: none;"><strong>Bcc:</strong> <span id="preview-bcc"></span></p>
        <p><strong>Subject:</strong> <span id="preview-subject">(Generating...)</span></p>
      </div>
      <h6>Email Body Preview:</h6>
      <div id="email-preview" class="email-preview">(Generating...)</div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
    <script>
      // --- Embedded Mail Generation Script START ---
      ${jsConstants}
      ${jsLogic}
      // --- Embedded Mail Generation Script END ---
    </script>
</body>
</html>`;
    return fullHtml;
  }

  // Add Buttons
  document.getElementById('addToProps')?.addEventListener('click', () => {
    addInput('toAddressesContainer', `
            <div class="input-group mb-2">
                <input type="email" class="form-control to-address" placeholder="another.to@example.com">
                <button class="btn btn-danger btn-sm remove-button" type="button">Remove</button>
            </div>`);
  });
  document.getElementById('addCcProps')?.addEventListener('click', () => {
    addInput('ccAddressesContainer', `
            <div class="input-group mb-2">
                <input type="email" class="form-control cc-address" placeholder="another.cc@example.com">
                <button class="btn btn-danger btn-sm remove-button" type="button">Remove</button>
            </div>`);
  });
  document.getElementById('addSubjectProps')?.addEventListener('click', () => {
    addInput('subjectLinesContainer', `
            <div class="input-group mb-2">
                <input type="text" class="form-control subject-line" placeholder="Another Subject Option">
                <button class="btn btn-danger btn-sm remove-button" type="button">Remove</button>
            </div>`);
  });
  document.getElementById('addPara1Props')?.addEventListener('click', () => {
    addInput('bodyPara1Container', `
            <div class="input-group mb-2">
                <textarea class="form-control body-para-1" placeholder="Another Intro Option"></textarea>
                <button class="btn btn-danger btn-sm remove-button" type="button">Remove</button>
            </div>`);
  });
  document.getElementById('addPara2Props')?.addEventListener('click', () => {
    addInput('bodyPara2Container', `
            <div class="input-group mb-2">
                <textarea class="form-control body-para-2" placeholder="Another Conflict/Issue Option"></textarea>
                <button class="btn btn-danger btn-sm remove-button" type="button">Remove</button>
            </div>`);
  });
  document.getElementById('addPara3Props')?.addEventListener('click', () => {
    addInput('bodyPara3Container', `
            <div class="input-group mb-2">
                <textarea class="form-control body-para-3" placeholder="Another Resolution/CTA Option"></textarea>
                <button class="btn btn-danger btn-sm remove-button" type="button">Remove</button>
            </div>`);
  });
  document.getElementById('addSignoffProps')?.addEventListener('click', () => {
    addInput('signingOffContainer', `
            <div class="input-group mb-2">
                <input type="text" class="form-control signing-off" placeholder="Another Signing Off Option">
                <button class="btn btn-danger btn-sm remove-button" type="button">Remove</button>
            </div>`);
  });

  // Remove Buttons (using event delegation on a common ancestor)
  document.body.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-button')) {
      removeInput(event.target);
    }
  });


  // --- Generate Button Event Listener ---
  const generateBtn = document.getElementById('generateButton');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      // Collect all data from the form fields
      const data = {
        pageTitle: document.getElementById('pageTitle')?.value.trim() || '',
        toAddresses: getValuesFromInputs('.to-address'),
        ccAddresses: getValuesFromInputs('.cc-address'),
        bccAddress: document.getElementById('bccAddress')?.value.trim() || '',
        subjectLines: getValuesFromInputs('.subject-line'),
        para1Options: getValuesFromInputs('.body-para-1'),
        para2Options: getValuesFromInputs('.body-para-2'),
        para3Options: getValuesFromInputs('.body-para-3'),
        signingOffOptions: getValuesFromInputs('.signing-off')
      };

      // Basic validation
      if (data.toAddresses.length === 0) {
        alert('Please provide at least one TO address.');
        return;
      }
      if (data.subjectLines.length === 0) {
        alert('Please provide at least one Subject Line option.');
        return;
      }
      if (data.para1Options.length === 0 || data.para2Options.length === 0 || data.para3Options.length === 0 || data.signingOffOptions.length === 0) {
        alert('Please provide at least one option for each body paragraph and the signing off section.');
        return;
      }

      try {
        // Generate HTML content for both platforms
        const mailHTML = generateHtmlContent(data);

        // Trigger downloads
        downloadFile('mail.html', mailHTML);

      } catch (error) {
        console.error("Error during HTML generation or download:", error);
        alert("An error occurred while generating the files. Please check the console for details.");
      }
    });
  } else {
    console.error("Generate button not found!");
  }

  // --- Load Campaign Functionality ---
  const loadCampaignButton = document.getElementById('loadCampaignButton');
  const campaignFileInput = document.getElementById('campaignFile');

  if (loadCampaignButton && campaignFileInput) {
    loadCampaignButton.addEventListener('click', () => {
      const file = campaignFileInput.files[0];
      if (file) {
        if (file.type === "text/html") {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const htmlContent = e.target.result;
              parseAndPopulateEditor(htmlContent);
              alert("Campaign data loaded successfully from file!");
              campaignFileInput.value = ''; // Reset file input
            } catch (error) {
              console.error("Error processing campaign file:", error);
              alert(`Error processing file: ${error.message}`);
            }
          };
          reader.onerror = () => {
            console.error("Error reading file:", reader.error);
            alert("Error reading file. See console for details.");
          };
          reader.readAsText(file);
        } else {
          alert("Please select an HTML file (.html or .htm).");
          campaignFileInput.value = ''; // Reset file input
        }
      } else {
        alert("Please select a file to load.");
      }
    });
  }
}); // End of DOMContentLoaded

// --- Helper functions for parsing and populating editor from uploaded file ---

function parseAndPopulateEditor(htmlString) {
  console.log("Starting to parse HTML content...");

  const pageTitle = extractPageTitle(htmlString);
  const pageTitleInput = document.getElementById('pageTitle');
  if (pageTitleInput) {
    pageTitleInput.value = pageTitle || "Email petition";
  } else {
    console.warn("Page title input field 'pageTitle' not found.");
  }

  const scriptContent = extractScriptContent(htmlString);
  if (!scriptContent) {
    alert("Could not find the embedded campaign script data in the HTML file. Form population may be incomplete.");
    console.warn("Embedded script content not found. Cannot populate most fields.");
    return;
  }
  console.log("Extracted script content snippet:", scriptContent.substring(0, 200) + "...");

  const toAddressesStr = extractConstString(scriptContent, 'TO_ADDRESS');
  const toAddresses = toAddressesStr ? toAddressesStr.split(',').map(s => s.trim()).filter(s => s) : [];
  populateDynamicFields('toAddressesContainer', 'to-address', toAddresses, 'email', 'TO Address');

  const ccAddressesStr = extractConstString(scriptContent, 'CC_ADDRESS');
  const ccAddresses = ccAddressesStr ? ccAddressesStr.split(',').map(s => s.trim()).filter(s => s) : [];
  populateDynamicFields('ccAddressesContainer', 'cc-address', ccAddresses, 'email', 'CC Address');

  const bccAddress = extractConstString(scriptContent, 'BCC_ADDRESS');
  const bccAddressInput = document.getElementById('bccAddress');
  if (bccAddressInput) {
    bccAddressInput.value = bccAddress;
  } else {
    console.warn("BCC address input field 'bccAddress' not found.");
  }

  const subjectLines = extractConstArray(scriptContent, 'SUBJECT_LINES');
  populateDynamicFields('subjectLinesContainer', 'subject-line', subjectLines, 'text', 'Subject Option');

  const para1Options = extractConstArray(scriptContent, 'PARA1_OPTIONS');
  populateDynamicFields('bodyPara1Container', 'body-para-1', para1Options, 'textarea', 'Introduction Option');

  const para2Options = extractConstArray(scriptContent, 'PARA2_OPTIONS');
  populateDynamicFields('bodyPara2Container', 'body-para-2', para2Options, 'textarea', 'Conflict/Issue Option');

  const para3Options = extractConstArray(scriptContent, 'PARA3_OPTIONS');
  populateDynamicFields('bodyPara3Container', 'body-para-3', para3Options, 'textarea', 'Resolution/CTA Option');

  const signingOffOptions = extractConstArray(scriptContent, 'SIGNING_OFF_OPTIONS');
  populateDynamicFields('signingOffContainer', 'signing-off', signingOffOptions, 'text', 'Signing Off Option');

  console.log("Editor population complete.");
}

function extractPageTitle(htmlString) {
  const titleMatch = htmlString.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  console.warn("Page title not found in the uploaded HTML.");
  return "";
}

function extractScriptContent(htmlString) {
  const scriptStartMarker = "// --- Embedded Mail Generation Script START ---";
  const scriptEndMarker = "// --- Embedded Mail Generation Script END ---";

  const startIndex = htmlString.indexOf(scriptStartMarker);
  if (startIndex === -1) {
    console.warn("Campaign script start marker not found in HTML content.");
    return null;
  }

  const endIndex = htmlString.indexOf(scriptEndMarker, startIndex + scriptStartMarker.length);
  if (endIndex === -1) {
    console.warn("Campaign script end marker not found in HTML content.");
    return null;
  }
  return htmlString.substring(startIndex + scriptStartMarker.length, endIndex);
}

function extractConstString(scriptContent, varName) {
  const regex = new RegExp(`const\\s+${varName}\\s*=\\s*"([^"]*)"(?:\\s*;)?`, 'm');
  const match = scriptContent.match(regex);
  if (match && typeof match[1] === 'string') {
    return match[1];
  }
  const singleQuoteRegex = new RegExp(`const\\s+${varName}\\s*=\\s*'([^']*)'(?:\\s*;)?`, 'm');
  const singleMatch = scriptContent.match(singleQuoteRegex);
  if (singleMatch && typeof singleMatch[1] === 'string') {
    return singleMatch[1];
  }
  console.warn(`String const ${varName} not found or malformed in script content.`);
  return "";
}

function extractConstArray(scriptContent, varName) {
  const regex = new RegExp(`const\\s+${varName}\\s*=\\s*(\\[(?:.|\\n|\\r)*?\\])(?:\\s*;)?`, 'm');
  const match = scriptContent.match(regex);
  if (match && match[1]) {
    try {
      // Attempt to parse as JSON. This is robust for arrays of strings.
      // For arrays that might contain non-string literals (though not expected from your templates),
      // a more complex parser or eval (with caution) might be needed.
      // Given your template structure, JSON.parse should be safe and effective.
      const arrayValue = JSON.parse(match[1]);
      if (Array.isArray(arrayValue)) {
        return arrayValue.map(item => String(item)); // Ensure all items are strings
      }
      console.warn(`Parsed value for ${varName} is not an array:`, arrayValue);
      return [];
    } catch (e) {
      console.error(`Error parsing array for ${varName} from content: ${match[1]}. Error: ${e.message}`);
      // Fallback for simple string arrays that might not be perfect JSON (e.g. trailing comma if not careful)
      // This is a more lenient fallback, but JSON.parse is preferred.
      try {
        const lenientMatch = match[1].replace(/^\[|\]$/g, '').split(',')
          .map(s => s.trim().replace(/^["']|["']$/g, '')); // Remove quotes and trim
        if (lenientMatch.length > 0 && lenientMatch[0] !== "") return lenientMatch.map(String);
      } catch (fallbackError) {
        console.error(`Fallback parsing also failed for ${varName}: ${fallbackError.message}`);
      }
      return [];
    }
  }
  console.warn(`Array const ${varName} not found or malformed in script content.`);
  return [];
}

function populateDynamicFields(containerId, inputClass, values, fieldType, placeholderPrefix) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with ID '${containerId}' not found. Cannot populate fields.`);
    return;
  }

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (values && values.length > 0) {
    values.forEach((value, index) => {
      const placeholder = `${placeholderPrefix} ${index + 1}`;
      createAndAddFieldToContainer(container, fieldType, inputClass, placeholder, value);
    });
  } else {
    console.log(`No values provided for ${containerId}; container is now empty.`);
    // Optionally, add a default blank field if the list is empty after loading
    // For example, for TO addresses or Subject lines, you might want at least one field.
    // if (containerId === 'toAddressesContainer' || containerId === 'subjectLinesContainer') {
    //     createAndAddFieldToContainer(container, fieldType, inputClass, `${placeholderPrefix} 1`, '');
    // }
  }
}

function createAndAddFieldToContainer(container, fieldType, inputClass, placeholder, value) {
  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group mb-2';

  let field;
  if (fieldType === 'textarea') {
    field = document.createElement('textarea');
    field.placeholder = placeholder;
    field.rows = 2;
  } else {
    field = document.createElement('input');
    field.type = fieldType;
    field.placeholder = placeholder;
  }
  field.className = `form-control ${inputClass}`;
  field.value = value || '';

  const removeButton = document.createElement('button');
  removeButton.className = 'btn btn-danger btn-sm remove-button';
  removeButton.type = 'button';
  removeButton.textContent = 'Remove';
  // The global event listener for '.remove-button' will handle this,
  // so no need to add an individual listener here if using event delegation.
  // removeButton.addEventListener('click', () => {
  //     inputGroup.remove();
  // });

  inputGroup.appendChild(field);
  inputGroup.appendChild(removeButton);
  container.appendChild(inputGroup);
}