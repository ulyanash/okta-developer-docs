// const blc = require('broken-link-checker');
const chalk = require('chalk');

// const linkExtRe = new RegExp('https?://.*/[^/]+\\.[a-z]+$');
// const trailingSlashRe = new RegExp('/$');

const linkchecker = require('linkinator');

const handler = require('serve-handler');
const http = require('http');
const { resolve } = require('path');

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/zeit/serve-handler#options
  return handler(request, response, {
    public: "packages/@okta/vuepress-site/dist"
  });
});

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

function normalizeUrl(url) {
  if (!linkExtRe.test(url) && !trailingSlashRe.test(url)) {
    url += "/";
  }
  return url;
}

// var siteChecker = new blc.SiteChecker(options, {
//   robots: function(robots, customData){},
//   html: function(tree, robots, response, pageUrl, customData){},
//   junk: function(result, customData){},
//   link: function(result, customData){
//     if (customData.firstLink) {
//       customData.firstLink = false;
//     }
//     if (result.broken) {
//       customData.brokenLinks.push(result);
//       customData.pageBrokenCount++;
//     } else if (result.excluded) {
//       customData.pageExcludedCount++;
//     } else {
//       //good link
//       if (customData.outputGoodLinks) {
//       }
//     }
//     customData.pageLinkCount++;
//   },
//   page: function(error, pageUrl, customData){
//     if (customData.pageLinkCount > 0) {
//       customData.totalLinkCount += customData.pageLinkCount;
//       customData.totalExcludedCount += customData.pageExcludedCount;
//       customData.totalBrokenCount += customData.pageBrokenCount;
//       customData.pageLinkCount = 0;
//       customData.pageExcludedCount = 0;
//       customData.pageBrokenCount = 0;
//     }
//     customData.firstLink = true;
//   },
//   site: function(error, siteUrl, customData){
//     if (customData.totalLinkCount > 0) {
//       console.log("SUMMARY");
//       console.log("Total Links Found: " + customData.totalLinkCount);
//       if (customData.totalBrokenCount > 0) {
//         console.log("Broken Links: " + chalk.bold.red(customData.totalBrokenCount));
//         console.log();
//         var brokenMap = summarizeBrokenLinks(customData);
//         for (const [outerKey, outerValue] of brokenMap.entries()) {
//           console.log(chalk.bold.red(" Link: " + outerKey));
//           for (const [innerKey, innerValue] of outerValue.entries()) {
//             console.log(chalk.cyan("  Page: " + innerKey + " (" + innerValue + ")"));
//           }
//           console.log();
//         }
//         this.fail = true;
//       } else {
//         console.log("Broken Links: " + chalk.bold.green(customData.totalBrokenCount));
//         this.fail = false;
//       }
//     } else {
//       console.log("No links found.");
//     }
//   },
//   end: function(){
//     if (this.fail) {
//       process.exit(1);
//     } else {
//       process.exit(0);
//     }
//   },
// });


server.listen(8081, () => {
  console.log('Running at http://localhost:8081');
});

// siteChecker.enqueue(siteUrl, customData);


const siteUrlForRegexp = siteUrl.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
console.log(siteUrlForRegexp, 'siteUrlForRegexp');


const linksToSkip = [
  "/*.xml$/",
  "/*.yml$/",
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
  // linksToSkip.push('/^('+siteUrlForRegexp+')/');
  linksToSkip.push('/^(http:\/\/localhost:8081)/');
}
if (options.excludeExternalLinks) {
  linksToSkip.push('/^(http)/');
}

console.log(linksToSkip, 'linkstoskip')


// async function simple() {
//   const results = await linkchecker.check({
//     // path: 'packages/@okta/vuepress-site/dist',
//     path: siteUrl,
//     recurse: false,
//     // linksToSkip: options.excludedKeywords
// //     linksToSkip: (link) => {
// // console.log(link, 'link');
// //     },
// //     linksToSkip: (link) => {
// //       const promise = new Promise((resolve, reject) => {
// // console.log('checking link',link)

// //         // skip internal
// //         if (link.indexOf(siteUrl) == 0) {
// //           resolve(true);
// //         }
// //         resolve(false);
// //       })
// //       //promise.then(res => console.log(res, "response")).catch(res => console.log(res, 'error res'));
// //       return promise;
// //     }
//     linksToSkip: linksToSkip
//   });

//   // To see if all the links passed, you can check `passed`
//   console.log(`Passed: ${results.passed}`);

//   // Show the list of scanned links and their results
//   console.log(results, 'results');

//   // Example output:
//   // {
//   //   passed: true,
//   //   links: [
//   //     {
//   //       url: 'http://example.com',
//   //       status: 200,
//   //       state: 'OK'
//   //     },
//   //     {
//   //       url: 'http://www.iana.org/domains/example',
//   //       status: 200,
//   //       state: 'OK'
//   //     }
//   //   ]
//   // }
// }
// simple();


async function complex() {
  // create a new `LinkChecker` that we'll use to run the scan.
  const checker = new linkchecker.LinkChecker();
  const data = {
    pageCount: 0
  };

  // Respond to the beginning of a new page being scanned
  checker.on('pagestart', url => {
    // console.log(`Scanning ${url}`);
    data.pageCount ++;
  });

  // After a page is scanned, check out the results!
  checker.on('link', result => {
if(result.state === 'BROKEN' && result.status !== 404) {
    // console.log(result, 'result')
    //console.log(result.failureDetails[0].headers['retry-after'], 'result retry-after')
}
if(result.state === 'BROKEN' && result.status !== 429) {
    // check the specific url that was scanned
    console.log(`  ${result.url}`);

    // How did the scan go?  Potential states are `BROKEN`, `OK`, and `SKIPPED`
    // console.log(`  ${result.state}`);

    // What was the status code of the response?
    // console.log(`  ${result.status}`);

    // What page linked here?
    // console.log(`  ${result.parent}`);
}
  });

  // Go ahead and start the scan! As events occur, we will see them above.
  const result = await checker.check({
    path: siteUrl,
    recurse: true,
    linksToSkip: linksToSkip,
    concurrency: 10
  });

  // Check to see if the scan passed!
  console.log(result.passed ? 'PASSED :D' : 'FAILED :(');

  // How many links did we scan?
  console.log(`Scanned total of ${result.links.length} links!`);

  // How many pages did we scan?
  console.log(chalk.bold.red(`Scanned total of ${data.pageCount} pages!`));

  // The final result will contain the list of checked links, and the pass/fail
  const brokeLinksCount = result.links.filter(x => (x.state === 'BROKEN' && x.status !== 429));
  console.log(`Detected ${brokeLinksCount.length} broken links.`);
}

complex();

