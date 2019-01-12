const cheerio = require('cheerio');
const rp = require('request-promise');

function parseInput(keyword) {
	const query = keyword.split(' ');
	return query.join('+');
}

module.exports = {
	/**
	 * Returns a list of results based on query
	 * @param {string} keyword
	 * @param page - Page must be an integer, defaults to page 1
	 */
	getSearch: async function(keyword, page = 1, options) {
		if (isNaN(page)) page = 1;

		const obj = {
			uri: `https://zerochan.net/${parseInput(keyword)}`,
			transform: function(body) {
				return cheerio.load(body);
			}
		};

		const urlReturn = await rp(obj, options)
			.then($ => { /* eslint arrow-body-style: 0 */
				return $('head').children('link[rel="canonical"]').attr('href');
			})
			.catch(err => console.log(err));

		obj.uri = `${urlReturn}?p=${page}`;

		if (obj.uri.includes('zerochan')) {
			return await rp(obj, options) /* eslint no-return-await: 0 */
				.then($ => {
					const results = [];
					$('#thumbs2').children('li').each(function() { /* eslint func-names: 0 */
						results.push({
							url: `https://www.zerochan.net${$(this).children('a').first()
								.attr('href')}`,
							image: $(this).children('p').children('a')
								.last()
								.attr('href')
						});
						if (!$(this).children('p').children('a') // If the result is a registration link, remove it from the array
							.last()
							.attr('href')) results.pop();
					});
					return results;
				})
				.catch(err => console.error(err));
		}
		return console.error(`Error: "${keyword}" is an invalid search term.`);
	},

	/**
	 * Returns first image result
	 * @param {string} keyword
	 */
	getFirstResult: async function(keyword, options) {
		const obj = {
			uri: `https://zerochan.net/${parseInput(keyword)}`,
			transform: function(body) {
				return cheerio.load(body);
			}
		};

		return await rp(obj, options)
			.then($ => {
				return $('#thumbs2').children('li').first()
					.children('p')
					.children('a')
					.last()
					.attr('href');
			})
			.catch(err => console.error(err));
	}
};
