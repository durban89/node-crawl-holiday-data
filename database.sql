CREATE TABLE `interest_date` (
  `autokid` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `thedate` int(11) NOT NULL COMMENT '时间组合',
  `date_str` varchar(100) NOT NULL DEFAULT '' COMMENT '时间日期字符串',
  `is_holiday` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否是假日',
  `is_holiday_work` tinyint(4) NOT NULL DEFAULT '0' COMMENT '周末工作日',
  `is_trade_day` tinyint(4) NOT NULL DEFAULT '0' COMMENT '交易日',
  `desc` varchar(100) NOT NULL DEFAULT '' COMMENT '是否是假日描述',
  PRIMARY KEY (`autokid`),
  UNIQUE KEY `UNI_DATE` (`thedate`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COMMENT='节假日日期';