/**
 * This javascript file will constitute the entry point of your solution.
 *
 * Edit it as you need.  It currently contains things that you might find helpful to get started.
 */

// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

// if you want to use es6, you can do something like
//     require('./es6/myEs6code')
// here to load the myEs6code.js file, and it will be automatically transpiled.

// Change this to get detailed logging from the stomp library
global.DEBUG = false;

const url = "ws://localhost:8011/stomp";
const client = Stomp.client(url);
let bidDataObj = {};
let subscription = null;
client.debug = function(msg) {
  if (global.DEBUG) {
    console.info({ msg });
  }
}

function connectCallback() {
  subscribe();
}

// bestAsk: 1.5297375811340215
// bestBid: 1.497855315022296
// lastChangeAsk: 0.0319781831136845
// lastChangeBid: 0.03907017339147223
// name: "euraud"
// openAsk: 1.5182379022231804
// openBid: 1.4485620977768197

// Sr. No
// Name
// Current best bid price
// Current best ask price
// Best bid last changed
// Amount the best ask price last changed

function sortBidDetails () {
  let bidDataArr = Object.values(bidDataObj);
  const tblEle = document.getElementById('tableBidData');
  let bitRows = '';

  bidDataArr.sort((a, b) => {
    if (a.lastChangeBid < b.lastChangeBid) {
      return 1;
    } else if (a.lastChangeBid > b.lastChangeBid) {
      return -1;
    } else {
      if (a.name < b.name) return 1;
      else if (a.name > b.name) return -1;
      else return 0;
    }
  });

  const sparklineArr = bidDataArr.map((item) => ( (item.bestAsk + item.bestBid) / 2 ));

  bidDataArr.forEach((item, index) => {
    bitRows += `
      <tr>
        <td>${index+1}</td>
        <td>${item.name}</td>
        <td>${item.bestAsk}</td>
        <td>${item.bestBid}</td>
        <td>${item.lastChangeAsk}</td>
        <td>${item.lastChangeBid}</td>
        <td id="${item.name}"></td>
      </tr>
    `
  });


  if (bitRows === '') {
    bitRows = `
      <tr>
        <td colspan="7"> No data is added yet </td>
      </tr>
    `;
  }
  tblEle.innerHTML = bitRows;
  bidDataArr.forEach((item, index) => {
    const arr = [];
    item.sparklineArr.forEach((item) => {
      const minTime = new Date(Date.now() - 30000).getTime();
      const maxTime = new Date().getTime();
      const itemArr = item.split('-');
      const time = parseInt(itemArr[0]);
      if (time > minTime && time < maxTime) {
        arr.push(parseFloat(itemArr[1]));
      }
    });
    var ele = document.getElementById(item.name);
    console.log(item.name, arr);
    if (ele) Sparkline.draw(ele, arr);
  });
}

/**
 * Function to scuscribe to connect
 */
function subscribe() {
  subscription = client.subscribe("/fx/prices", function (res){
    const data = JSON.parse(res.body);
    const obj = bidDataObj[data.name];
    const midPrice = obj ? (data.bestAsk + data.bestBid) / 2 : null;

    const time = new Date().getTime();
    const sparklineArr = obj ? [...obj.sparklineArr, `${time}-${midPrice}`] : [];

    bidDataObj[data.name] = {
      sparklineArr,
      bestAsk: data.bestAsk,
      bestBid: data.bestBid,
      lastChangeAsk: data.lastChangeAsk,
      lastChangeBid: data.lastChangeBid,
      name: data.name,
      openAsk: data.openAsk,
      openBid: data.openBid,
    };
    sortBidDetails();
  });
}

/**
 * Function to unscuscribe to connect
 */
function unsubscibe() {
  if (subscription) subscription.unsubscribe();
}

client.connect({}, connectCallback, function(error) {
  alert(error.headers.message)
})
