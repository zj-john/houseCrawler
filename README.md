# houseCrawler
爬取房天下网站房型、房价数据的爬虫

## 运行步骤：  
前提：已安装node.js。
1. npm install
2. 修改db.js中的数据库配置文件
3. 打开数据库工具，导入create.sql
4. 爬取二手房数据
```
node fangtianxia_old.js
```
5. 爬取新房数据
```
node fangtianxia_new.js
```

## 结果
运行完成后，结果保存在数据库中，可以自行导出为excel文件中

## 后续计划
* 针对反爬，检测到获取不到数据（需要输入验证码的页面），记录报错url
* 爬取完成后，针对报错url进行二次爬取
* 全部爬取完成后，导出为excel文件
