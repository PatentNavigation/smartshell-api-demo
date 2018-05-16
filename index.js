#!/usr/bin/env node
'use strict'

const request = require('request-promise');
const fs = require('fs');

const [ , , filePath ] = process.argv;
if (!filePath) {
  process.stderr.write('Must specify path to PDF as command-line argument\n');
  process.exit(1);
}
if (!fs.existsSync(filePath)) {
  process.stderr.write(`File not found: ${filePath}\n`);
  process.exit(1);
}

//
// TurboPatent users must sign up as part of a provisioned client organization.
// When we onboard a new client organization, we set up a private domain for
// them, such as https://skynet.turbopatent.us, and all SkyNet users would have
// to access all of our web apps through that domain. Thus, when navigating the
// user to the SmartShell web application, their organization domain must be
// known and specified.
//
const orgDomain = 'smartshell-trial';

async function run() {
  let resp;

  try {
    resp = await request({
      method: 'POST',
      url: `https://${orgDomain}.turbopatent.us/services/pair/office-action/ocr-ext/`,
      // This POST returns a 302 redirect to a status-polling API endpoint. The
      // response from that endpoint includes the id needed to proceed with the
      // integration flow
      followAllRedirects: true,
      formData: {
        'pdf_file': fs.createReadStream(filePath)
      }
    });
  } catch (e) {
    process.stderr.write(`Failed to POST to API endpoint: ${e}\n`);
    process.exit(1);
  }

  // The response contains some other details, but the ID is all that is needed
  // in order to construct the SmartShell web app URL
  let id = JSON.parse(resp).id;

  let url = `https://${orgDomain}.turbopatent.us/officeaction/shell/get-shell/${id}/`;
  process.stdout.write(`OCR task started. To continue, browse to ${url}\n`);
}

run();
