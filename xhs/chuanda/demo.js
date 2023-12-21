const Crawler = require('crawler')
const fs = require('fs')

const host = 'https://www.xiaohongshu.com'

let crawledUrls = new Set()

// 从文件中读取已经爬取过的URL
fs.readFile('crawled_urls.txt', 'utf8', (err, data) => {
	if (err) {
		console.log('No crawled urls found')
	} else {
		crawledUrls = new Set(data.split('\n'))
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
	rateLimit: 15000, // gap 15 sec
	limiter: host,
	timeout: 45000,
	userAgent:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	callback: function (error, res, done) {
		if (error) {
			console.log(error)
			fs.appendFile('error_urls.txt', res.options.uri + '\n', function (err) {
				if (err) throw err
			})
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
				'results.json',
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

fs.readFile('url.json', 'utf8', (err, data) => {
	if (err) throw err
	const urls = JSON.parse(data).map((item) => {
		const id = item.link.split('/')[2]
		return { uri: `${host}${item.link}`, id: id }
	})
	const filterUrls = urls.filter((item) => !crawledUrls.has(item.uri))
	// console.log(urls.length, filterUrls.length)
	// console.log(filterUrls[0])
	c.queue(filterUrls)
})

// c.queue(`${host}/explore/${id}`)
