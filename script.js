   // --- Dynamic Input Field Handling ---

   function addInput(containerId, inputType, className, placeholder) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Container not found:", containerId);
        return;
    }
    const div = document.createElement('div');
    div.className = 'input-group mb-2';

    let inputElement;
    if (inputType === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.rows = 3;
    } else {
        inputElement = document.createElement('input');
        inputElement.type = inputType;
    }
    inputElement.className = `form-control ${className}`;
    inputElement.placeholder = placeholder;

    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-danger btn-sm';
     // Add specific class if textarea for CSS alignment hook
     if (inputType === 'textarea') {
         div.classList.add('input-group-textarea'); // Add class to parent group
     }
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.onclick = function() { removeInput(this); };

    div.appendChild(inputElement);
    div.appendChild(removeButton);
    container.appendChild(div);
}

function removeInput(button) {
    const inputGroup = button.closest('.input-group');
    if (inputGroup) {
        inputGroup.remove();
    } else {
        console.error("Could not find parent '.input-group' for remove button.");
    }
}

// --- File Generation Logic ---

function generateFiles() {
    console.log("Generate files called");
    try {
        const pageTitle = document.getElementById('pageTitle').value;
        const bccAddress = document.getElementById('bccAddress').value;

        const toAddresses = Array.from(document.querySelectorAll('.to-address')).map(input => input.value.trim()).filter(Boolean);
        const ccAddresses = Array.from(document.querySelectorAll('.cc-address')).map(input => input.value.trim()).filter(Boolean);
        const subjectLines = Array.from(document.querySelectorAll('.subject-line')).map(input => input.value.trim()).filter(Boolean);
        const bodyPara1Options = Array.from(document.querySelectorAll('.body-para-1')).map(textarea => textarea.value.trim()).filter(Boolean);
        const bodyPara2Options = Array.from(document.querySelectorAll('.body-para-2')).map(textarea => textarea.value.trim()).filter(Boolean);
        const bodyPara3Options = Array.from(document.querySelectorAll('.body-para-3')).map(textarea => textarea.value.trim()).filter(Boolean);
        const signingOffOptions = Array.from(document.querySelectorAll('.signing-off')).map(input => input.value.trim()).filter(Boolean);

        // --- Basic Input Validation ---
         if (!pageTitle) throw new Error("Please enter a Page Title.");
         if (toAddresses.length === 0) throw new Error("Please enter at least one TO address.");
         if (subjectLines.length === 0) throw new Error("Please enter at least one Subject Line option.");
         if (bodyPara1Options.length === 0) throw new Error("Please enter at least one Body Paragraph 1 option.");
         if (bodyPara2Options.length === 0) throw new Error("Please enter at least one Body Paragraph 2 option.");
         if (bodyPara3Options.length === 0) throw new Error("Please enter at least one Body Paragraph 3 option.");
         if (signingOffOptions.length === 0) throw new Error("Please enter at least one Signing Off option.");

        // --- Generate HTML Content ---
        console.log("Generating Android HTML...");
        const androidHtmlContent = createHtmlTemplate(
            pageTitle, toAddresses, ccAddresses, bccAddress, subjectLines,
            bodyPara1Options, bodyPara2Options, bodyPara3Options, signingOffOptions, true
        );
        console.log("Generating iPhone HTML...");
        const iphoneHtmlContent = createHtmlTemplate(
            pageTitle, toAddresses, ccAddresses, bccAddress, subjectLines,
            bodyPara1Options, bodyPara2Options, bodyPara3Options, signingOffOptions, false
        );

        // --- Trigger Downloads ---
        console.log("Triggering downloads...");
        downloadFile('androidmail.html', androidHtmlContent);
        downloadFile('iphonemail.html', iphoneHtmlContent);
        console.log("Downloads triggered.");

    } catch (error) {
        console.error("Error during file generation:", error);
        alert(`Error generating files: ${error.message || error}`);
    }
}


function createHtmlTemplate(title, to, cc, bcc, subjects, para1s, para2s, para3s, signoffs, useLineBreaks) {
    // Safely escape data for embedding into JS strings within the template
    const escapedSubjects = JSON.stringify(subjects);
    const escapedPara1s = JSON.stringify(para1s);
    const escapedPara2s = JSON.stringify(para2s);
    const escapedPara3s = JSON.stringify(para3s);
    const escapedSignoffs = JSON.stringify(signoffs);

    const lineBreak = useLineBreaks ? '%0D%0A' : '%20'; // CRLF is more universal (especially for Android GMail)
    const doubleLineBreak = useLineBreaks ? '%0D%0A%0D%0A' : '%20%20';


    const toString = to.join(',');
    const ccString = cc.join(',');
    const bccString = bcc; // Already a single string

    // This JS code will be embedded inside the generated HTML's script tag
    const embeddedJavaScript = `
const TO_ADDRESS = "${escapeJsString(toString)}";
const CC_ADDRESS = "${escapeJsString(ccString)}";
const BCC_ADDRESS = "${escapeJsString(bccString)}";
const SUBJECT_LINES = ${escapedSubjects}; // Already JSON stringified, safe
const PARA1_OPTIONS = ${escapedPara1s};
const PARA2_OPTIONS = ${escapedPara2s};
const PARA3_OPTIONS = ${escapedPara3s};
const SIGNING_OFF_OPTIONS = ${escapedSignoffs};
const LINE_BREAK = "${lineBreak}"; // Use the specific line break for this file type
const DOUBLE_LINE_BREAK = "${doubleLineBreak}";

let mailtoLink = '';
let copyText = ''; // Body only for preview/copy
let selectedSubject = '';

function getRandomElement(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

 function escapeHtmlForDisplay(unsafe) {
     // Simplified escape for text content display
     if (typeof unsafe !== 'string') return '';
     return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
 }

// Function to process text for mailto body (handles newlines)
function processTextForMailto(text) {
    if (typeof text !== 'string') return '';
    // Replace actual newline characters with the required encoded version
    return text.replace(/\\n/g, LINE_BREAK);
}

function prepareMail() {
    try {
        selectedSubject = getRandomElement(SUBJECT_LINES);
        const selectedPara1 = getRandomElement(PARA1_OPTIONS);
        const selectedPara2 = getRandomElement(PARA2_OPTIONS);
        const selectedPara3 = getRandomElement(PARA3_OPTIONS);
        const selectedSignoff = getRandomElement(SIGNING_OFF_OPTIONS);

        // --- Construct body for mailto link (URL encoded) ---
        const bodyForMailto = [
            processTextForMailto(selectedPara1),
            processTextForMailto(selectedPara2),
            processTextForMailto(selectedPara3),
            processTextForMailto(selectedSignoff) // Process signoff too, just in case
        ].join(DOUBLE_LINE_BREAK); // Join paragraphs

        // --- Construct mailto link ---
        const params = new URLSearchParams();
        if (CC_ADDRESS) params.append('cc', CC_ADDRESS);
        if (BCC_ADDRESS) params.append('bcc', BCC_ADDRESS);
        // Only add subject/body if they exist to avoid empty params
        if (selectedSubject) params.append('subject', selectedSubject);
        if (bodyForMailto) params.append('body', bodyForMailto);

         if (TO_ADDRESS) {
             // Encode TO address properly, handle multiple addresses if needed
             const encodedTo = TO_ADDRESS.split(',').map(e => encodeURIComponent(e.trim())).join(',');
             mailtoLink = \`mailto:\${encodedTo}?\${params.toString()}\`;
         } else {
              mailtoLink = '';
              console.error("TO address is missing.");
         }

        // --- Construct body text for preview/copy (plain text) ---
        copyText = \`\${selectedPara1}\\n\\n\${selectedPara2}\\n\\n\${selectedPara3}\\n\\n\${selectedSignoff}\`;

        // Update preview elements safely
        const subjectElem = document.getElementById('preview-subject');
        const previewElem = document.getElementById('email-preview');
        if (subjectElem) subjectElem.textContent = escapeHtmlForDisplay(selectedSubject);
        if (previewElem) previewElem.textContent = copyText; // Display plain text body

    } catch (err) {
        console.error("Error in prepareMail:", err);
        alert("An error occurred while preparing the email preview.");
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
     const sendButton = document.getElementById('send');
     const copyButton = document.getElementById('copy');

     if (sendButton) {
        sendButton.addEventListener('click', () => {
            if (mailtoLink) {
                window.location.href = mailtoLink;
            } else {
                alert('Could not generate mailto link. Please ensure TO address is provided.');
            }
        });
    }

     if (copyButton) {
        copyButton.addEventListener('click', () => {
             if (!copyText && !selectedSubject) {
                 alert('Email content not generated yet. Please reload or check generator inputs.');
                 return;
             }
             const fullEmailText = \`To: \${TO_ADDRESS}\\n\${CC_ADDRESS ? \`Cc: \${CC_ADDRESS}\\n\` : ''}\${BCC_ADDRESS ? \`Bcc: \${BCC_ADDRESS}\\n\` : ''}Subject: \${selectedSubject}\\n\\n\${copyText}\`;

             navigator.clipboard.writeText(fullEmailText).then(() => {
                 alert('Email content copied to clipboard!');
             }).catch(err => {
                 console.warn('Clipboard API failed, trying fallback:', err);
                 // Fallback
                 const textarea = document.createElement('textarea');
                 textarea.value = fullEmailText;
                 textarea.style.position = 'fixed'; textarea.style.left = '-9999px';
                 document.body.appendChild(textarea);
                 textarea.select();
                 try { document.execCommand('copy'); alert('Email content copied (fallback)!'); }
                 catch (errFallback) { console.error('Fallback copy failed:', errFallback); alert('Failed to copy automatically.'); }
                 document.body.removeChild(textarea);
             });
        });
    }
    // Initial preparation on load
     prepareMail();
});
    `; // End of embeddedJavaScript string

    // The main HTML template structure for the generated file
    // It includes the embeddedJavaScript within its <script> tag
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<style>
body{background-color:white;color:black;padding-top:1rem;padding-bottom:1rem;}
.container{max-width:800px;}
.btn-custom-primary{background-color:#2E4989;border-color:#2E4989;color:white;}
.btn-custom-primary:hover{background-color:#1e3a75;border-color:#1e3a75;color:white;}
.btn-custom-secondary{background-color:#DFD3B9;border-color:#DFD3B9;color:black;}
.btn-custom-secondary:hover{background-color:#c9bfa5;border-color:#c9bfa5;color:black;}
.email-preview{background-color:#f8f9fa;border:1px solid #dee2e6;padding:1.5rem;margin-top:1rem;border-radius:.375rem;white-space:pre-wrap;word-wrap:break-word;font-family:monospace;max-height:50vh;overflow-y:auto;}
h5,h6{color:#2E4989;}
#email-details p{margin-bottom:.5rem;word-wrap:break-word;}
</style>
</head>
<body>
<div class="container">
<h5 class="mb-3 text-center">Email Preview & Actions</h5>
<p class="text-center text-muted small">If your email app doesn't open, please use the copy button.</p>
<div class="text-center mb-4">
    <button id="send" class="btn btn-custom-primary btn-lg me-2" type="button"><i class="bi bi-send"></i> Send Mail</button>
    <button id="copy" class="btn btn-custom-secondary me-2" type="button"><i class="bi bi-clipboard"></i> Copy Email Content</button>
</div>
<h6>Email Details:</h6>
<div id="email-details" class="mb-3">
    <p><strong>To:</strong> <span id="preview-to">${escapeHtml(toString)}</span></p>
    ${ccString ? `<p><strong>Cc:</strong> <span id="preview-cc">${escapeHtml(ccString)}</span></p>` : ''}
    ${bccString ? `<p><strong>Bcc:</strong> <span id="preview-bcc">${escapeHtml(bccString)}</span></p>` : ''}
    <p><strong>Subject:</strong> <span id="preview-subject">(Generating...)</span></p>
</div>
<h6>Email Body Preview:</h6>
<div id="email-preview" class="email-preview">(Generating...)</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"><\/script>
<script>
// --- Embedded Mail Generation Script START ---
${embeddedJavaScript}
// --- Embedded Mail Generation Script END ---
<\/script>
</body>
</html>`; // Ensure final backtick is present and correct
} // End of createHtmlTemplate function


// --- Utility Functions ---

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
     // Basic fallback download
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     setTimeout(() => {
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
     }, 100);
}

// **FIXED** Restored correct HTML escaping for display purposes
 function escapeHtml(unsafe) {
     if (typeof unsafe !== 'string') return '';
     return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
 }

// Escapes strings for safe insertion into JS code (within double quotes usually)
function escapeJsString(str) {
     if (typeof str !== 'string') return '';
     return str.replace(/\\/g, '\\\\') // 1. Escape backslashes FIRST
               .replace(/"/g, '\\"')  // 2. Escape double quotes
               .replace(/\n/g, '\\n') // 3. Escape newlines
               .replace(/\r/g, '\\r') // 4. Escape carriage returns
               .replace(/\t/g, '\\t') // 5. Escape tabs
               // Escape other potentially problematic chars if needed
               .replace(/</g, '\\x3C') // Script tag breaking chars
               .replace(/>/g, '\\x3E');
}

// --- Attach Event Listeners Programmatically ---
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed - Attaching listeners");

    const generateBtn = document.getElementById('generateButton');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateFiles);
        console.log("Listener attached to generateButton");
    } else { console.error("Generate button not found!"); }

    const addToPropsBtn = document.getElementById('addToProps');
    if (addToPropsBtn) {
        addToPropsBtn.addEventListener('click', () => addInput('toAddressesContainer', 'email', 'to-address', 'to@example.com'));
         console.log("Listener attached to addToProps");
    } else { console.error("Add TO button not found"); }

    const addCcPropsBtn = document.getElementById('addCcProps');
    if (addCcPropsBtn) {
        addCcPropsBtn.addEventListener('click', () => addInput('ccAddressesContainer', 'email', 'cc-address', 'cc@example.com'));
         console.log("Listener attached to addCcProps");
    } else { console.error("Add CC button not found"); }

    const addSubjectPropsBtn = document.getElementById('addSubjectProps');
    if (addSubjectPropsBtn) {
        addSubjectPropsBtn.addEventListener('click', () => addInput('subjectLinesContainer', 'text', 'subject-line', 'Another Subject Option'));
         console.log("Listener attached to addSubjectProps");
    } else { console.error("Add Subject button not found"); }

     const addPara1PropsBtn = document.getElementById('addPara1Props');
    if (addPara1PropsBtn) {
         addPara1PropsBtn.addEventListener('click', () => addInput('bodyPara1Container', 'textarea', 'body-para-1', 'Another Intro Option'));
          console.log("Listener attached to addPara1Props");
    } else { console.error("Add Para1 button not found"); }

    const addPara2PropsBtn = document.getElementById('addPara2Props');
     if (addPara2PropsBtn) {
         addPara2PropsBtn.addEventListener('click', () => addInput('bodyPara2Container', 'textarea', 'body-para-2', 'Another Conflict/Issue Option'));
         console.log("Listener attached to addPara2Props");
    } else { console.error("Add Para2 button not found"); }

    const addPara3PropsBtn = document.getElementById('addPara3Props');
     if (addPara3PropsBtn) {
         addPara3PropsBtn.addEventListener('click', () => addInput('bodyPara3Container', 'textarea', 'body-para-3', 'Another Resolution/CTA Option'));
          console.log("Listener attached to addPara3Props");
     } else { console.error("Add Para3 button not found"); }

     const addSignoffPropsBtn = document.getElementById('addSignoffProps');
    if (addSignoffPropsBtn) {
        addSignoffPropsBtn.addEventListener('click', () => addInput('signingOffContainer', 'text', 'signing-off', 'Best regards,'));
         console.log("Listener attached to addSignoffProps");
    } else { console.error("Add Signoff button not found"); }

     console.log("Finished attaching listeners.");
});