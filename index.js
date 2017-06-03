#!/usr/bin/env node

/**
 * crawl holiday data
 */

'use strict';

const request = require('request');
const debug = require('debug')('crawl_holiday_data');
const querystring = require('querystring');
const moment = require('moment');
const program = require('commander');
const mysql = require('mysql');

program
  .version('0.0.1')
  .option('-d, --date [date]', 'YYYY年M月')
  .option('-f, --config [config]', 'YYYY年M月')
  .parse(process.argv);

debug('program.date = ', program.date);
debug('program.config = ', program.config);

if (!program.date) {
  return;
}

if (!program.config) {
  return;
}

let isValidFormat = moment(program.date, 'YYYY年M月', true).isValid();
if (!isValidFormat) {
  return;
}

const config = require(program.config);
const connection = mysql.createConnection(config);

let path = 'https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php';
let queryArgs = {
  query: program.date,
  co: '',
  resource_id: 6018,
  t: new Date().valueOf(),
  ie: 'utf8',
  oe: 'gbk',
  format: 'json',
  tn: 'baidu',
  '_': new Date().valueOf()
};

let queryString = querystring.stringify(queryArgs);
let url = path + '?' + queryString;
debug('url = ', url);
request(url, function(error, response, body) {
  if (error) {
    debug(error.stack);
    return;
  }
  debug('body = ', body);
  let data = JSON.parse(body);
  if (!data.status) {
    return;
  }

  debug('data holiday = ', data.data[0].holiday);

  let holiday = data.data[0].holiday;
  let day = data.data[0].almanac;
  if (!holiday || !holiday.length) {
    holiday = [];
  }
  debug('day = ', day);
  if (!day || !day.length) {
    return;
  }

  let holidays = {};
  for (let i in holiday) {
    if (!holiday[i].list || !holiday[i].list.length) {
      continue;
    }

    for (let j in holiday[i].list) {
      holidays[holiday[i].list[j].date] = { date: holiday[i].list[j].date, status: holiday[i].list[j].status };
    }
  }
  debug('holidays', holidays);

  let days = [];
  for (let i in day) {
    days.push(day[i]['date']);
  }

  debug('days', days);

  let saveDatas = [];
  for (let i in days) {
    let saveData = {
      date_str: days[i],
      thedate: days[i].replace(/-/ig, ''),
      is_holiday: 0,
      is_holiday_work: 0,
      is_trade_day: 1
    };

    let week = moment(days[i], 'YYYY-M-D').format('e');
    if (week == 0 || week == 6) {
      saveData.is_holiday = 1;
      saveData.is_trade_day = 0;
    }

    if (holidays.hasOwnProperty(days[i])) {
      if (holidays[days[i]].status == 1) {
        saveData.is_holiday = 1;
        saveData.is_trade_day = 0;
      } else if (holidays[days[i]].status == 2) {
        saveData.is_holiday = 1;
        saveData.is_holiday_work = 1;
        saveData.is_trade_day = 0;
      }
    }

    saveDatas.push(saveData);
  }

  debug('saveDatas = ', saveDatas);

  let sqls = [];
  for (let i in saveDatas) {
    let keys = Object.keys(saveDatas[i]);
    let values = [];
    for (let j in saveDatas[i]) {
      values.push(mysql.escape(saveDatas[i][j]));
    }
    sqls.push(`REPLACE INTO ${config.tableName} (${keys.join(',')}) VALUES (${values.join(',')})`);
  }

  debug('sqls = ', sqls);
  connection.connect(function(err) {
    if (err) {
      debug('error connecting: ' + err.stack);
      return;
    }

    debug('connected as id ' + connection.threadId);

    connection.query(sqls.join('; '), function(error, results, fields) {
      if (error) {
        debug(error.stack);
        connection.destroy();
        return;
      };

      connection.end(function(err) {
        // The connection is terminated now
        if (err) {
          connection.destroy();
        }
      });
    });
  });
});
