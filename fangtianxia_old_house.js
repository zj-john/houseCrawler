/*

Fang.com 二手房数据

*/
const crawler = require("crawler");
const url = require('url');
const moment = require('moment');
const _ = require('lodash');
const path = require('path');
const db = require('./db');
const _utils = require('./utils');

// https://github.com/sindresorhus/ua-string Get the user agent of a recent Chrome version to pretend to be a browser in network requests
const uaString = require('ua-string');
const utils = new _utils();

const crawlerIndexUrl = "http://esf.sh.fang.com/";

db.connect();

const c = new crawler({
    maxConnections: 1,
    rateLimit: 5000, // gap 5 sec
    limiter: 'list',
    timeout: 45000,
    userAgent: uaString
});

const listFetcher = (error, res, done) => {

    if(error){
      let export_error = "URL: " +  res.options.uri + ";Error: " + error;
      utils.export_to_file(export_error, "./error/" + moment().format("YYYY-MM-DDTHH-mm-ss") + '.txt');
    }else{
        let $ = res.$
        let nextPageEl = $('#PageControl1_hlk_next');

        //has next page?
        if(nextPageEl.length > 0){

            let nextPage = nextPageEl.attr("href");
            nextPage = url.resolve(res.options.uri, nextPage);
            c.queue([
                {
                    uri: nextPage,
                    callback: listFetcher,
                    city: res.options.city,
                    limiter: 'list'
                }
            ])
        }

        let processors = _.filter($('div.houseList dl dd p.title a'), (link) => {
            if (link.attribs && link.attribs.href) {
              return true
            } else {
              return false;
            }
        }).map((link)=>{
            // console.log(link);
            return {
                uri: url.resolve(res.options.uri, link.attribs.href),
                callback: detailProcessor,
                city: res.options.city,
                // Low values have higher priority
                priority: 3,
                maxConnections: 1,
                rateLimit: 10000, // gap 10 sec
                limiter: 'detail'
            }
        });
        // process house detail
        c.queue(processors);

    }
    done();
}

c.queue([
    // 上海
    {
        uri: 'http://esf.sh.fang.com/',
        callback: listFetcher,
        city: '上海'
    }
]);


// Emitted when queue is empty.
c.on('drain',function(){
    db.end();// close connection to MySQL
    console.log('done!');
});

// Emitted when crawler is ready to send a request.
c.on('request',function(options){
    let now = Date();
    console.log (`${now}[request][${options.city}]${options.uri}`);
});

let queue = [
  {
    "url":"http://esf.sh.fang.com/house-a025/",
    "name": "浦东",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a018/",
    "name": "闵行",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a019/",
    "name": "徐汇",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a030/",
    "name": "宝山",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a028/",
    "name": "普陀",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a020/",
    "name": "长宁",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a026/",
    "name": "杨浦",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a0586/",
    "name": "松江",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a029/",
    "name": "嘉定",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a023/",
    "name": "虹口",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a027/",
    "name": "闸北",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a021/",
    "name": "静安",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a024/",
    "name": "黄浦",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a022/",
    "name": "卢湾",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a031/",
    "name": "青浦",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a032/",
    "name": "奉贤",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a035/",
    "name": "金山",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a0996/",
    "name": "崇明",
    "page": 1,
    "maxPage": 0
  },
  {
    "url":"http://esf.sh.fang.com/house-a01046/",
    "name": "上海周边",
    "page": 1,
    "maxPage": 0
  }
];
// let queue = [{ uri: 'http://esf.sh.fang.com/house-a025/', name: '浦东', page: 1, maxPage: 0 }]

const detailProcessor = (error, res, done) => {
    if(error) {
        let export_error = "URL: " +  res.options.uri + ";Error: " + error;
        utils.export_to_file(export_error, "./error/" + moment().format("YYYY-MM-DDTHH-mm-ss") + '.txt');
        done();
    }else{
        let $ = res.$;
        let numReg = /[^\d.]/g;
        let infoReg = /([\s\S]*)：([\s\S]*)/g;
        let emptyReg = /[\r\n ]/g;
        let detail = {};
        // 区
        let zone = $(".tab-cont-right .tr-line").first().next().next().next().find(".trl-item2").first().next().find(".rcont").find("a").first().text();
        // 标题
        let title = $("#lpname div").first().text();
        // 房型
        let layout = $(".tab-cont-right .tr-line").first().next().find(".w146 .tt").text();
        // 楼层
        let floor = $(".tab-cont-right .tr-line").first().next().next().find(".w182 .tt").text();
        // 朝向
        let orientations = $(".tab-cont-right .tr-line").first().next().next().find(".w146 .tt").text();
        // 建筑年代
        let buildTime = $(".fydes-item .cont .text-item").first().find("span").next().last().text();
        // 辖区
        let community = $(".tab-cont-right .tr-line").first().next().next().next().find(".trl-item2").first().next().find(".rcont").find("a").last().text().replace(/[\r\n ]/g,"");
        // 地址
        let addr = $(".tab-cont-right .tr-line").first().next().next().next().find(".trl-item2").first().find(".rcont").text().replace(/[\r\n ]/g,"").replace("地图", "");
        // 面积
        let area = $(".tab-cont-right .tr-line").first().next().find(".w182 .tt").text();
        // 总价
        let sumPrice = $(".price_esf ").text();
        // 均价
        let avaPrice = $(".tab-cont-right .tr-line").first().next().find(".w132 .tt").text();
        // 首付
        let firstPay = $(".trl-item_top .rel .trl-item").first().text();
        // 月供
        let monthPay = $("#FirstYG").html();
        // 总楼层
        let floorNum = $(".tab-cont-right .tr-line").first().next().next().find(".w182").find("div").last().text();
        // 装修
        let decoration = $(".tab-cont-right .tr-line").first().next().next().find(".w132 .tt").text();
        // 学校
        let school = $(".tab-cont-right .tr-line").first().next().next().next().find(".trl-item2").last().find(".rcont").text().replace(/[\r\n ]/g,"");
        // 电梯
        let elevator = $(".fydes-item .cont .text-item").first().next().find("span").first().text().replace(emptyReg,"").replace(infoReg, "") === '有无电梯'?
              $(".fydes-item .cont .text-item").first().next().find("span").last().text():
              "";
        // 产权性质
        let buildOwn = $(".fydes-item .cont .text-item").first().next().next().find("span").first().text().replace(emptyReg,"").replace(infoReg, "") === '产权性质'?
            $(".fydes-item .cont .text-item").first().next().next().find("span").last().text():
            "";
        // 住宅类别
        let houseType = $(".fydes-item .cont .text-item").first().next().next().next().find("span").first().text().replace(emptyReg,"").replace(infoReg, "") === '住宅类别'?
            $(".fydes-item .cont .text-item").first().next().next().next().find("span").last().text():
            "";
        // 建筑结构
        let buildStructure = $(".fydes-item .cont .text-item").first().next().next().next().next().find("span").first().text().replace(emptyReg,"").replace(infoReg, "") === '建筑结构'?
            $(".fydes-item .cont .text-item").first().next().next().next().next().find("span").last().text():
            "";
        // 建筑类别
        let buildType = $(".fydes-item .cont .text-item").first().next().next().next().next().next().find("span").first().text().replace(emptyReg,"").replace(infoReg, "") === '建筑类别'?
            $(".fydes-item .cont .text-item").first().next().next().next().next().next().find("span").last().text():
            "";
        // 挂牌时间
        let sellTime = $(".fydes-item .cont .text-item").first().next().next().next().next().next().next().find("span").first().text().replace(emptyReg,"").replace(infoReg, "") === '挂牌时间'?
            $(".fydes-item .cont .text-item").last().find("span").next().last().text():
            "";
        // console.log(monthPay);
        // let priceReg = /\d+/;
        // let commentReg = /(\d+\.\d+)\[(\d+)/;
        let tagDoms = $(".bqian").find('span');
        let tagList = [];
        tagDoms.each( (j, item) => {
          tagList.push($(item).text());
        })

        let now = Date();
        console.log (`${now}[fetching][${res.options.city}]${title}`);
        detail = {
          "zone": zone.replace(emptyReg,""),
          "title": title.replace(emptyReg,""),
          "layout": layout.replace(emptyReg,""),
          "floor": floor.replace(emptyReg,""),
          "orientations": orientations.replace(emptyReg,""),
          "buildTime": buildTime.replace(emptyReg,""),
          "community": community.replace(emptyReg,""),
          "addr": addr.replace(emptyReg,""),
          "tags": tagList.join(",").replace(emptyReg,""),
          "area": area.replace(numReg,""),
          "sumPrice": sumPrice.replace(numReg,""),
          "avaPrice": avaPrice.replace(numReg,""),
          "firstPay": firstPay.replace(numReg,""),
          "monthPay": monthPay,
          "floorNum": floorNum.replace(emptyReg,""),
          "decoration": decoration.replace(emptyReg,""),
          "school": school.replace(emptyReg,""),
          "elevator": elevator.replace(emptyReg,""),
          "buildOwn": buildOwn.replace(emptyReg,""),
          "houseType": houseType.replace(emptyReg,""),
          "buildStructure": buildStructure.replace(emptyReg,""),
          "sellTime": sellTime.replace(emptyReg,""),
          "buildType": buildType.replace(emptyReg,""),
          "updateTime": moment().format("YYYY-MM-DDTHH-mm-ss")
        };
        // console.log(detail);
        insert_sql(detail);
        done();
    }

}


const newHandleFunction = (error, res, done) => {
  if (error) {
    let export_error = "URL: " +  res.options.uri + ";Error: " + error;
    utils.export_to_file(export_error, "./error/" + moment().format("YYYY-MM-DDTHH-mm-ss") + '.txt');
  } else {
    let $ = res.$;
    // 判断是否重定向, 如果页面数量超标的话则会重定向到其他页面
    if (res.request.headers.referer == undefined) {
      // 获取页面数据
      let content = [],
          reg = /[^\d]/g;

      $('.houseList').find('dl').each((i, item) => {
        let $item = $(item).find("dd");
        // console.log($item)
        let zone = res.options.name,
            title = $item.children('p').first().find('a').prop("title"),
            props_list = $item.children('p').first().next().text().split('|'),
            layout = "",
            floor = "",
            ori = "",
            build_time = "",
            p3 = $item.children('p').first().next().next(),
            community = p3.children("a").prop("title"),
            addr = p3.children("span").text(),
            tag_doms = $item.children('div').first().children("div").first().find('span'),
            area = $item.children('div').first().next().children("p").first().text(),
            price = $item.children('div').last().children("p").first().children("span").first().text(),
            average_price = $item.children('div').last().children("p").last().text(),
            tags = "";
        if (props_list.length === 4) {
          layout = props_list[0];
          floor = props_list[1];
          ori = props_list[2];
          build_time = props_list[3];
        }
        tag_doms.each( (j, item) => {
          tags = tags + $(item).text() + ",";
        })
        tags  = tags.substring(0, tags.length-1);


        if(!!title || !!layout || !!floor || !!ori || !!build_time || !!community || !!addr || !!area || !!tags || !!price || !!price || !!average_price) {
          // console.log("content",zone, title, layout, floor, ori, buildTime, community, addr, area, tags, price, avarage_price );
          content.push({
            "zone": zone,
            "title": title.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "layout": layout.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "floor": floor.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "ori": ori.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "build_time": build_time.toString().replace(reg,""),
            "community": community.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "addr": addr.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "tags": tags,
            "area": area.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "price": price.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "average_price": average_price.replace(/[\r\n]/g,"").replace(/(^\s*)|(\s*$)/g, ""),
            "update_time": moment().format("YYYY-MM-DDTHH-mm-ss")
          });
        }
      });
      // console.log(content);

      // 处理数据
      insert_sql(content);

      // 如果是首页，需要把后续各个页码对应的url加入queue
      if (res.options.page === 1) {
        // 获取总page
        var page = $(".fanye .txt").text(),
        // 获取剩余 URL，添加到 queue
            maxPage = page.replace(reg,"");
        // console.log("maxPage", maxPage);
        let newQueue = [],
            i = 2;
        for (; i<= maxPage; i++) {
          queue.push(
            {
              "url":"http://esf.sh.fang.com/house-a025/i3" + i.toString() + "/",
              "name": res.options.name,
              "page": i,
              "maxPage": maxPage
            }
          )
        }
        // crawlerMeta.queue(newQueue);
      }
    }
  }
  done();
}

const insert_sql = (data) => {
  db.query('INSERT INTO fangtianxia_old SET ?', data, function (err, rows, fields) {
   if(err){
      console.log('INSERT ERROR - ', err.message);
      return;
     }
     // console.log("INSERT SUCCESS");
  });

}

// 初始化crawler对象，赋默认属性
// const crawlerMeta = new crawler({
//   maxConnections: 1,
//   // rateLimit: 20000, // 间隔20s
//   userAgent: uaString,
//   callback : newHandleFunction
// })

// const entry = ()=> {
//   crawlerMeta.queue(queue);
// }

// entry();
