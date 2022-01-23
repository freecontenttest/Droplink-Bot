require('dotenv').config();

const isAdmin = (ctx) => {
    const fromId = getFromId(ctx)
    const USERS = process.env.SUDO_USERS.split(',');
    if (!fromId || !USERS.includes(String(fromId))) return { success: false , error: '⚠️  This command is Admin only !!!'};
    else return { success: true }
};

const getFromId = (ctx) => {
    if (ctx.message) {
        return ctx.message.from.id
    } else if (ctx.callbackQuery) {
        return ctx.callbackQuery.from.id
    } else if (ctx.inlineQuery) {
        return ctx.inlineQuery.from.id
    } else {
        return null
    }
};

const sendReply = (ctx, results) => {
    if (results.error) {
        return ctx.reply(results.error.msg);
    }
    if (results.total > 0) {
        const res = results.data[0];
        ctx.reply(`*Showing results from DB*\n\n*ID :* \`${res.id || 'N/A'}\`\n\n*Uniq ID :* \`${res.uniq_id}\`\n\n*Original URL :* \`${res.org_url}\`\n\n*Droplink :* \`${res.droplink}\`\n\n*Video Metadata *{\n      *Name :* \`${res.video_name}\`\n      *Size :*  \`${formatBytes(res.video_size)}\`\n      *Duration :*  \`${secondsToHms(res.video_duration)}\`\n}`, {
            parse_mode: 'markdown'
        });
    } else {
        ctx.reply('No results found !!');
    }
};

const secondsToHms = (value) => {
    const d = Number(value);
    const h = Math.floor(d / 3600);
    const m = Math.floor(d % 3600 / 60);
    const s = Math.floor(d % 3600 % 60);

    const hDisplay = h > 0 ? (h < 10 ? '0' + h : h) + (h == 1 ? " hour" : " hours") : "";
    const mDisplay = m > 0 ? (m < 10 ? '0' + m : m) + (m == 1 ? " minute" : " minutes") : "";
    const sDisplay = s > 0 ? (s < 10 ? '0' + s : s) + (s == 1 ? " second" : " seconds") : "";

    if (hDisplay && mDisplay && sDisplay) return hDisplay + ', ' + mDisplay + ', ' + sDisplay;
    if (hDisplay && mDisplay) return hDisplay + ', ' + mDisplay;
    if (hDisplay && sDisplay) return hDisplay + ', ' + sDisplay
    if (mDisplay && sDisplay) return mDisplay + ', ' + sDisplay;
    if (hDisplay) return hDisplay;
    if (mDisplay) return mDisplay;
    if (sDisplay) return sDisplay;
    return '00: 00 : 00';
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getCaption = (shortenLink, BACKUP_CHANNEL, isScreenshot=false) => {
    const isDropLink = shortenLink.includes('droplink');
    const isPdiskLink = shortenLink.includes('pdisklink');
    
    const DEF_CAPTION = '🔰  _HOW TO WATCH_ :\n\n➤  _Just Install PLAYit App from PlayStore_\n➤  🚀 _High Speed Download & No Buffering_\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📥 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐋𝐢𝐧𝐤𝐬/👀𝐖𝐚𝐭𝐜𝐡 𝐎𝐧𝐥𝐢𝐧𝐞\n\n\n';
    let URL_CAPTION = `❓️ _How To Download From ${isDropLink ? 'DROPLINK' : (isPdiskLink ? 'PDISKLINK' : 'SHORTURLLINK')}_\n          _(${isDropLink ? 'DropLink' : (isPdiskLink ? 'PdiskLink' : 'ShortUrlLink')} से वीडियो कैसे डाउनलोड करे)_ 👇🏻️\n➤ https://t.me/how\\_to\\_download\\_movie\\_official/${isDropLink ? 4 : (isPdiskLink ? 8 : 7)}\n\n\n🎬 *Video Link*\n ➪ ${shortenLink}\n\n\n`;
    if (isScreenshot) URL_CAPTION = '🔞️ _Screenshots/Preview/Trailer_\n ➪ Replace\\_Link\n\n' + URL_CAPTION;
    const BACKUP_CAPTION = `💠 _Backup Channel_ :\n ➤ ${BACKUP_CHANNEL}\n\n♻️ _Other Channels :_\n ➤ https://t.me/my\\_channels\\_list\\_official`;
    
    return DEF_CAPTION + URL_CAPTION + BACKUP_CAPTION;
};

const regExpEscape = (String) => {
    return String.replace(/[-[\]{}()*_+!<=:?.\/\\^$|#\s,]/g, '\\$&');
};

const getMdiskCaption = (shortenLink, BACKUP_CHANNEL, isScreenshot=false) => {
    const DEF_CAPTION = `*_💋️ Best Adult Premium Video\n\n\n❓️ How To Watch/Download From Mdisk\n        \\(Mdisk से वीडियो कैसे देखें/डाउनलोड करे\\) 👇🏻️\n➤ ${regExpEscape('https://t.me/how_to_download_movie_official/6')}\n\n\n`;
    const SCREENSHOT_URL = '🔞️ Screenshots/Preview/Trailer :\n ➪ Replace\\_Link\n\n';
    const URL_CAPTION = `︵‿︵‿︵‿︵‿୨♡୧‿︵‿︵‿︵‿︵\n\n📢 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐋𝐢𝐧𝐤𝐬/👀𝐖𝐚𝐭𝐜𝐡 𝐎𝐧𝐥𝐢𝐧𝐞 📌\n                    ««  MX PLAYER  »»\n\n\n${isScreenshot ? SCREENSHOT_URL : ''}🎬 Video Link :\n ➪ ${regExpEscape(shortenLink)}\n\n\n🚀 High Speed Download & No Buffering\n\n︵‿︵‿︵‿︵‿୨♡୧‿︵‿︵‿︵‿︵\n\n\n`;
    const BACKUP_CAPTION = `💠 Backup Channel :\n ➤ ${regExpEscape(BACKUP_CHANNEL)}\n\n♻️ Other Channels :\n ➤ ${regExpEscape('https://t.me/my_channels_list_official')}_*`;
    
    return DEF_CAPTION + URL_CAPTION + BACKUP_CAPTION;
};

const getPostImage = () => {
    const postImagesArr = [
        'https://wallpapersmug.com/download/2560x1600/1e31d7/hot-anime-girl-and-cookiie.jpg',
        'http://cdn23.us1.fansshare.com/photos/hdwallpapers-moviemobile/cartoon-girl-pictures-hd-wallpaper-hot-522110899.jpg',
        'https://static7.depositphotos.com/1007989/747/i/600/depositphotos_7476302-stock-photo-girl-holding-a-rose.jpg',
        'https://p4.wallpaperbetter.com/wallpaper/77/337/176/beautiful-sexy-art-blue-black-hd-wallpaper-preview.jpg',
        'https://c4.wallpaperflare.com/wallpaper/93/786/463/anime-1920x1080-art-wallpaper-preview.jpg',
        'https://wallpaper.dog/large/20499482.jpg',
        'https://cdn.wallpapersafari.com/76/83/7DzuGx.jpg',
        'https://cutewallpaper.org/21/sexy-wonder-woman-wallpaper/Hot-and-Sizzling-HD-Cartoon-World-1000.jpg',
        'https://www.wallpapertip.com/wmimgs/181-1818539_hot-cartoon-wallpaper-49-group-wallpapers.jpg',
        'https://p4.wallpaperbetter.com/wallpaper/171/571/683/girl-sexy-anime-pretty-blonde-hd-wallpaper-preview.jpg',
        'http://4everstatic.com/pictures/850xX/cartoons/anime-and-fantasy/sexy-anime-girl,-black-underwear-196092.jpg',
        'https://www.pngfind.com/pngs/m/304-3042076_car-lady-car-female-model-png-transparent-png.png',
        'https://www.pikpng.com/pngl/m/126-1268896_megan-fox-png-image-megan-fox-transparent-png.png',
        'https://w7.pngwing.com/pngs/883/534/png-transparent-girl-computer-file-woman-girl-people-girls-car.png',
        'https://cdn.pixabay.com/photo/2020/03/01/11/06/retro-pin-up-girls-4892347_1280.png',
        'http://4everstatic.com/pictures/850xX/cartoons/cartoon-woman,-sexy-blonde-182454.jpg',
        'http://3.bp.blogspot.com/-zuDzp8oVj-o/TYv70ReAAiI/AAAAAAAABIw/OfUaFCzz6Yo/s1600/Minitokyo_Anime_Wallpapers_Onegai_Teacher_3073_.jpg',
        'https://wallpaper-mania.com/wp-content/uploads/2018/09/High_resolution_wallpaper_background_ID_77700951146-692x376.jpg',
        'https://c4.wallpaperflare.com/wallpaper/373/589/76/anime-babes-cleavage-girl-wallpaper-preview.jpg',
        'http://2.bp.blogspot.com/-fD_YOV9O6Ow/UbBw21Co7sI/AAAAAAAADbE/2AVdOCWlKjA/s1600/Sexy+ecchi+ANime+www.animefullfights.com.jpg',
        'https://img5.goodfon.com/wallpaper/nbig/e/89/anime-girl-sexy-erotic-gray-hair-long-hair-azur-lane-formi-2.jpg',
        'https://animegrill.com/wp-content/uploads/2021/08/Suguha-Kirigaya-from-Sword-Art-Online.jpg',
        'https://img5.goodfon.com/wallpaper/nbig/2/d5/anime-girl-sexy-erotic-redhead-long-hair-erza-scarlet-fairy.jpg',
        'https://img5.goodfon.com/wallpaper/nbig/d/74/anime-girl-sexy-erotic-brunette-long-hair-lingerie-underwe-5.jpg',
        'https://xxgasm.com/wp-content/upload/2021/03/naked_anime-9893.jpg',
        'https://raikou2.donmai.us/sample/1a/ba/sample-1aba0ba9c93c71cd7fe15f65b9693106.jpg',
        'https://img5.goodfon.com/original/1366x768/2/21/anime-girl-sexy-erotic-white-hair-long-hair-lingerie-underwe.jpg',
        'https://img5.goodfon.com/wallpaper/nbig/b/c0/anime-girl-sexy-azur-lane-dido-breasts-boobs-pretty-beautifu.jpg',
        'https://img5.goodfon.com/wallpaper/nbig/8/da/anime-girl-sexy-erotic-dark-blue-hair-long-hair-bikini-breas.jpg',
        'https://img5.goodfon.com/wallpaper/nbig/1/99/anime-girl-sexy-erotic-brunette-long-hair-bikini-swimsuit-br.jpg',
        'https://img5.goodfon.com/wallpaper/nbig/0/8a/anime-girl-sexy-erotic-blonde-long-hair-azur-lane-algerie-bi.jpg',
        'https://img5.goodfon.com/wallpaper/nbig/2/fc/belyi-fon-devushka-bikini.jpg'
    ];
    
    return postImagesArr[Math.floor(Math.random()*postImagesArr.length)];
};

module.exports = {
    isAdmin,
    sendReply,
    secondsToHms,
    formatBytes,
    getCaption,
    getMdiskCaption,
    regExpEscape,
    getPostImage
};
