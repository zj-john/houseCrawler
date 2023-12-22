const data = []

const dataO = {}
data.forEach((i) => {
	dataO[i.link] = i.title
})
const result = Object.keys(dataO).map((i) => {
	return {
		link: i,
		title: dataO[i],
	}
})
console.log(result)
