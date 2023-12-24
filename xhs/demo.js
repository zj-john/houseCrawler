const Crawler = require('crawler')
const fs = require('fs')

const host = 'https://www.xiaohongshu.com'
const dirName = 'meishi'

let crawledUrls = new Set()

// 从文件中读取已经爬取过的URL
fs.readFile('crawled_urls.txt', 'utf8', (err, data) => {
	if (err) {
		console.log('No crawled urls found')
	} else {
		crawledUrls = new Set(data.split('\n').map((i) => i.replace('\\r', '')))
	}
})

// 获取内容的另一种方法
// postId:res.options.id
const getContent = ($, postId) => {
	const html = $('body').html()
	const regex = /<script>window\.__INITIAL_STATE__=(.*?)<\/script>/
	const match = html.match(regex)
	const initialState = match[1].replaceAll('undefined', '"NO VALUE"')
	try {
		if (initialState) {
			const contentJson = JSON.parse(initialState)
			const note = contentJson?.['note']?.['noteDetailMap']?.[postId]?.['note']
			const title = note['title'] || ''
			const desc = note['desc'] || ''
			const tagList = (note['tagList'] || []).map((item) => item.name)
			// console.log('提取的内容: ', title, desc, tagList)
			return {
				title,
				desc,
				tagList,
			}
		} else {
			return {
				title: '',
				desc: '',
				tagList: [],
			}
		}
	} catch (e) {
		return {
			title: '',
			desc: '',
			tagList: [],
		}
	}
}

const c = new Crawler({
	maxConnections: 1,
	// rateLimit: 15000, // gap 15 sec
	preRequest: (options, done) => {
		// 生成8到15秒之间的随机延迟时间
		const delay = Math.floor(Math.random() * (15000 - 8000 + 1) + 8000)
		// 延迟一段时间后执行done回调函数
		setTimeout(() => {
			done()
		}, delay)
	},
	limiter: host,
	timeout: 45000,
	userAgent:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	callback: function (error, res, done) {
		if (error) {
			console.log(error)
			fs.appendFile(
				`./${dirName}/error_urls.txt`,
				res.options.uri + '\n',
				function (err) {
					if (err) throw err
				}
			)
		} else {
			const $ = res.$
			const title = $('meta[name="og:title"]').attr('content')
			const desc = $('meta[name="description"]').attr('content')
			const tags = $('meta[name="keywords"]')
				.attr('content')
				?.split(',')
				.map((item) => item.trim())
			const images = []
			$('meta[name="og:image"]').each(function () {
				images.push($(this).attr('content'))
			})
			const result = {
				uri: res.options.uri,
				title,
				desc,
				images,
				tags,
			}
			fs.appendFile(
				`./${dirName}/results.json`,
				JSON.stringify(result) + ',\n',
				function (err) {
					if (err) throw err
				}
			)
			// console.log(result)
		}
		crawledUrls.add(res.options.uri)
		fs.appendFile('crawled_urls.txt', res.options.uri + '\n', function (err) {
			if (err) throw err
		})
		done()
	},
})

// Emitted when queue is empty.
c.on('drain', function () {
	console.log('done!')
})

// Emitted when crawler is ready to send a request.
c.on('request', function (options) {
	let now = Date()
	console.log(`${now}[request]${options.uri}`)
})

fs.readFile(`./${dirName}/url.json`, 'utf8', (err, data) => {
	if (err) throw err
	const urls = JSON.parse(data).map((item) => {
		const id = item.link.split('/')[2]
		return { uri: `${host}${item.link}`, id: id }
	})
	const filterUrls = urls.filter((item) => !crawledUrls.has(item.uri))
	console.log(urls.length, filterUrls.length)
	// console.log(crawledUrls,crawledUrls.has(urls[0].uri))
	c.queue(filterUrls)
})

// 假设你的爬虫函数是async函数，可以使用await
async function crawlData() {
	let count = 0 // 初始化计数器
	const n = 10 // 设定每n条数据后暂停
	const pauseDuration = 120000 // 暂停时间2分钟（单位毫秒）

	while (true) {
		// 或者某个条件，取决于你何时想停止爬虫
		// ... 这里是你的爬取逻辑 ...

		// 假设每次循环爬取一条数据
		count++ // 爬取成功后，计数器加1

		if (count >= n) {
			// 如果达到了设定的阈值
			console.log(`Crawled ${n} items, pausing for 2 minutes...`)
			await new Promise((resolve) => setTimeout(resolve, pauseDuration)) // 暂停2分钟
			count = 0 // 重置计数器
		}
	}
}
