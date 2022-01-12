// const blc = require('broken-link-checker');
const chalk = require('chalk');

// const linkExtRe = new RegExp('https?://.*/[^/]+\\.[a-z]+$');
// const trailingSlashRe = new RegExp('/$');

const linkchecker = require('linkinator');

// const handler = require('serve-handler');
// const http = require('http');
// const { resolve } = require('path');

// const server = http.createServer((request, response) => {
//   // You pass two more arguments for config and middleware
//   // More details here: https://github.com/zeit/serve-handler#options
//   return handler(request, response, {
//     public: "packages/@okta/vuepress-site/dist"
//   });
// });

var options = {
  excludedKeywords: [
    "*.xml",
    "*.yml",
    "/img",
    "/assets",
    "/fonts",
    "/docs/api/postman",
    "/favicon",
    "/blog/",
    "/product/",
    "/product/*",
    "github.com/okta/okta-developer-docs/edit",
  ]
};

const linkCheckMode = process.argv.slice(2) == '' ? 'all' : process.argv.slice(2);
console.log("Link Check Mode: " + linkCheckMode);

if (linkCheckMode == 'internal') {
  console.log("Running internal link check...");
  options.excludeExternalLinks = true;
} else if (linkCheckMode == 'external') {
  console.log("Running external link check...");
  options.excludeInternalLinks = true;
} else {
  console.log("Running both internal and external link check...");
}

var siteUrl = "http://localhost:8081";
var customData = {
  outputGoodLinks: false,
  normalizeUrls: true, // ensure trailing slash for link/page URLs
  brokenLinks: [],
  firstLink: true,
  pageLinkCount: 0,
  pageExcludedCount: 0,
  pageBrokenCount: 0,
  totalLinkCount: 0,
  totalExcludedCount: 0,
  totalBrokenCount: 0
};

function summarizeBrokenLinks(customData) {
  var brokenLinkMap = new Map();
  for (const result of customData.brokenLinks) {
    var linkUrl;
    var pageUrl;
    if (customData.normalizeUrls) {
      linkUrl = normalizeUrl(result.url.resolved);
      pageUrl = normalizeUrl(result.base.resolved);
    } else {
      linkUrl = result.url.resolved;
      pageUrl = result.base.resolved;
    }
    var pageLinkMap;
    if (!brokenLinkMap.has(linkUrl)) {
      pageLinkMap = new Map();
      pageLinkMap.set(pageUrl, 1);
      brokenLinkMap.set(linkUrl, pageLinkMap);
    } else {
      pageLinkMap = brokenLinkMap.get(linkUrl);
      if (!pageLinkMap.has(pageUrl)) {
        pageLinkMap.set(pageUrl, 1);
      } else {
        pageLinkMap.set(pageUrl, pageLinkMap.get(pageUrl) + 1);
      }
    }
  }
  return brokenLinkMap;
}

// server.listen(8081, () => {
//   console.log('Running at http://localhost:8081');
// });

const siteUrlForRegexp = siteUrl.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
console.log(siteUrlForRegexp, 'siteUrlForRegexp');


const linksToSkip = [
  new RegExp("\.xml$", 'img'),
  new RegExp("\.yml$", 'img'),
  "/img",
  "/assets",
  "/fonts",
  "/docs/api/postman",
  "/favicon",
  "/blog/",
  "/product/",
  "/product/*",
  "github.com/okta/okta-developer-docs/edit",
];

if (options.excludeInternalLinks) {
  linksToSkip.push(new RegExp('^(http:\/\/localhost:)', 'img'));
}
if (options.excludeExternalLinks) {
  linksToSkip.push(new RegExp('^(?!(http:\/\/localhost:))', 'img'));
}

console.log(linksToSkip, 'linkstoskip')
// return

async function complex() {
  // create a new `LinkChecker` that we'll use to run the scan.
  const checker = new linkchecker.LinkChecker();
  const data = {
    pageCount: 0,
    pageInit: false,
  };

  // Respond to the beginning of a new page being scanned
  checker.on('pagestart', url => {
// console.log(`Scanning ${url}`);
    data.pageCount ++;
    data.pageInit = false;
  });

  // After a page is scanned, check out the results!
  checker.on('link', result => {
// if(result.state === 'BROKEN' && result.status !== 404) {
    // console.log(result, 'result')
    //console.log(result.failureDetails[0].headers['retry-after'], 'result retry-after')
// }
// if(result.state === 'BROKEN' && result.status !== 429) {
    if(result.state === 'BROKEN') {
        // check the specific url that was scanned
        console.log(`  ${result.url}`);

        // How did the scan go?  Potential states are `BROKEN`, `OK`, and `SKIPPED`
        // console.log(`  ${result.state}`);

        // What was the status code of the response?
        // console.log(`  ${result.status}`);

        // What page linked here?
        console.log(`  ${result.parent} - parent`);
    }
  });

  // Go ahead and start the scan! As events occur, we will see them above.
  const result = await checker.check({
    // path: siteUrl,
    path: 'packages/@okta/vuepress-site/dist',
    port: 8008,
    recurse: true,
    concurrency: 10,
    // directoryListing: true,
    // linksToSkip: linksToSkip,
    linksToSkip: (link) => {
// console.log(chalk.bold.red(link), 'link');

      return new Promise((resolve, reject) => {
// console.log(data.pageInit, 'data.pageInit');
        // skip first root check
        if(data.pageInit === false) {
          data.pageInit = true;
          resolve(false);
        }

        // check linksToSkip
        const skips = linksToSkip
          .map(linkToSkip => {
            return new RegExp(linkToSkip).test(link);
          })
          .filter(match => !!match);
        if (skips.length > 0) {
          resolve(true);
        }

        resolve(false);
      })
    },
  });

  // Check to see if the scan passed!
  console.log(result.passed ? 'PASSED :D' : 'FAILED :(');

  // How many links did we scan?
  console.log(`Scanned total of ${result.links.length} links!`);

  // How many pages did we scan?
  console.log(chalk.bold.red(`Scanned total of ${data.pageCount} pages!`));

  // The final result will contain the list of checked links, and the pass/fail
  // const brokeLinksCount = result.links.filter(x => (x.state === 'BROKEN' && x.status !== 429));
  const brokeLinksCount = result.links.filter(x => (x.state === 'BROKEN'));
  console.log(`Detected ${brokeLinksCount.length} broken links.`);
}

complex();
// process.exit(1);
