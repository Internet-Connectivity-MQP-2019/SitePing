// Domains to ping
// Source: https://www.alexa.com/topsites/countries/US
const domains = [
	{name: "Google-2", domain: "https://www.google.com/images/searchbox/desktop_searchbox_sprites302_hr.png", rank: 1},
	{name: "Youtube", domain: "https://s.ytimg.com/yts/img/favicon_32-vflOogEID.png", rank: 2},
	{name: "Amazon", domain: "https://www.amazon.com/empty.gif", rank: 3},
	{name: "Yahoo", domain: "https://s.yimg.com/os/mit/ape/m/81f43c2/t.gif", rank: 4},
	{name: "Facebook", domain: "https://static.xx.fbcdn.net/images/emoji.php/v9/t91/1.5/16/1f44d_1f3fc.png", rank: 5},
	{name: "Reddit", domain: "https://www.redditstatic.com/desktop2x/img/renderTimingPixel.png", rank: 6},
	{name: "Wikipedia", domain: "https://www.wikipedia.org/static/apple-touch/wikipedia.png", rank: 7},
	{name: "Ebay", domain: "https://ir.ebaystatic.com/pictures/aw/pics/s_1x2.gif", rank: 8},
	{name: "Office", domain: "https://a.fp.measure.office.com/apc/trans.gif", rank: 9},
	{name: "Bing", domain: "https://www.bing.com/favicon.ico", rank: 10},
	{name: "Netflix", domain: "https://help.nflxext.com/helpcenter/fc264264a231904b0fce67cd98399e10.svg", rank: 11},
	{name: "ESPN", domain: "https://a.espncdn.com/combiner/i?img=%2Fi%2Fespn%2Fnetworks_shows%2F500%2Fundefeated.png&w=60&h=60&scale=crop&cquality=80&location=origin", rank: 12},
	{name: "Salesforce", domain: "https://c1.sfdcstatic.com/etc/clientlibs/sfdc-aem-master/clientlibs_base/imgs/spacer.gif", rank: 13}, /* Salesforce */
	{name: "Live", domain: "https://logincdn.msauth.net/16.000.28394.11/images/ellipsis_grey.svg", rank: 14},
	{name: "Instructure", domain: "https://www.instructure.com/sites/blog.instructure/files/uploaded-assets/menu/logo/starter.svg", rank: 15},
	{name: "Chase", domain: "https://creditcards.chase.com/R111-003/1110010/images/chasebank-logo-icon.svg", rank: 16},
	{name: "Apple", domain: "https://www.apple.com/ac/globalnav/5/en_US/images/globalnav/links/tv/image_large.svg", rank: 17},
	{name: "Instagram", domain: "https://www.instagram.com/static/images/shared/nav-shadow.png/fae1c515f490.png", rank: 18},
	/*{name: "MicrosoftOnline", domain: "www.microsoftonline.com/favicon.ico", rank: 19}, */ // Not responding
	{name: "CNN", domain: "https://cdn.cnn.com/cnn/images/bulletin/arrow.png", rank: 20},
	{name: "Dropbox", domain: "https://cfl.dropboxstatic.com/static/images/icons/icon_spacer-vflN3BYt2.gif", rank: 21},
	{name: "Tmall", domain: "https://g.alicdn.com/s.gif", rank: 22},
	{name: "LinkedIn", domain: "https://static-exp1.licdn.com/sc/h/3z4gbn751g6l5onl9gg9s5ckg", rank: 23},
	{name: "Twitter", domain: "https://abs.twimg.com/favicons/favicon.ico", rank: 24},
	{name: "Twitch", domain: "https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png", rank: 25},
	/* {name: "Salesforce", domain: "www.salesforce.com/favicon.ico", rank: 26}, */ // Duplicate
	{name: "Microsoft", domain: "https://www.microsoft.com/onerfstatics/marketingsites-eus-prod/_h/9be151e5/coreui.statics/images/1x1clear.gif", rank: 27},
	{name: "Shopify", domain: "https://cdn.shopify.com/shopify-marketing_assets/static/shopify-favicon.png", rank: 28},
	{name: "NYTimes", domain: "https://www.nytimes.com/vi-assets/static-assets/icon-facebook-20x20-fullcolor-7312c440fd2b6f323c675d8a08c023e2.svg", rank: 29},
	/* {name: "Craigslist", domain: "www.craigslist.com/favicon.ico", rank: 30}, */ // Doesn't like no cache parameter
	{name: "Walmart", domain: "https://www.walmart.com/favicon.ico", rank: 31},
	{name: "Pornhub", domain: "https://ci.phncdn.com/www-static/images/rightArrow.png", rank: 32},
	{name: "Adobe", domain: "https://www.adobe.com/content/dam/cc/icons/device-web.svg", rank: 33},
	/* {name: "LiveJasmine", domain: "www.livejasmine.com/favicon.ico", rank: 34}, */ // Not working
	{name: "IMDb", domain: "https://m.media-amazon.com/images/G/01/imdb/images/rating/spinner-3099941772._V_.gif", rank: 35},
	{name: "Stackoverflow", domain: "https://cdn.sstatic.net/Img/home/votes.svg?v=989b3861569f", rank: 36},
	{name: "AWS", domain: "https://d1.awsstatic.com/webteam/homepage/solutions/60-windows-workloads.b5e9ac06613bcaf464fba96f7245e912aeaa7155.png", rank: 37},
	{name: "Sohu", domain: "https://statics.itc.cn/web/v3/static/images/pic/service/pic02.gif", rank: 38}, // Sohu.com
	{name: "QQ", domain: "https://pgdt.gtimg.cn/gdt/0/precon.png/0?_=0.7358115759256028", rank: 39},
	{name: "Indeed", domain: "https://www.indeed.com/hp/rpc/frontendlogging?logType=trackEvent&moduleName=event&application=indeedmobile&pageId=homepage&data=%7B%22eventName%22%3A%22mobPageLoadInfo%22%2C%22type%22%3A%22mobPageLoadInfo%22%2C%22pageId%22%3A%22homepage%22%2C%22mobtk%22%3A%221dqo1t8694tgr800%22%2C%22pageName%22%3A%22hp%22%2C%22pixelRatio%22%3A1.5%2C%22scrWidth%22%3A2560%2C%22scrHeight%22%3A1440%2C%22scrOrientation%22%3A%22landscape%22%7D", rank: 40},
	{name: "Zillow", domain: "https://www.zillow.com/apple-touch-icon.png", rank: 41},
	{name: "Wellsfargo", domain: "https://www01.wellsfargomedia.com/assets/images/css/template/homepage/homepage-magnifying-glass.png", rank: 42},
	{name: "Spotify", domain: "https://www.scdn.co/i/home/hero-burst.svg", rank: 43},
	{name: "MSN", domain: "https://static-global-s-msn-com.akamaized.net/hp-eus/sc/9b/e151e5.gif", rank: 44},
	{name: "Imgur", domain: "https://s.imgur.com/desktop-assets/desktop-assets/icon-leaderboard.2c7c197ab7cc58a23c14b83dcc3025a9.svg", rank: 45},
	/* {name: "Tmall", domain: "www.login.tmall.com/favicon.ico", rank: 46}, */ // Duplicate
	{name: "Yelp", domain: "https://s3-media0.fl.yelpcdn.com/assets/public/72x72_more_categories@2x.yji-e7be9a50bf8cf4a2eea9f7d7e2b5f194.png", rank: 47},
	{name: "Taobao", domain: "https://img.alicdn.com/tfs/TB1VlKFRpXXXXcNapXXXXXXXXXX-16-16.png", rank: 48},
	{name: "Etsy", domain: "https://www.etsy.com/assets/dist/images/favorite/dots.20190424142746.svg", rank: 49},
	{name: "Hulu", domain: "https://www.hulu.com/static/hitch/static/icons/facebook.svg", rank: 50}];

export default domains;
