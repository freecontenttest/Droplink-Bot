const { Telegraf } = require('telegraf');
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);

const axios = require('axios').default;
const path = require('path');

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const db = require('./public/js/queries');
const func = require('./public/js/functions');

const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    }
});
client.connect();

const express = require('express');
const app = express();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get('/', async (req, res) => {
    res.send('Welcome !!');
});

app.get('/:id', async (req, res) => { 
    if ((req.params.id).includes('.')) return;
    
    await axios.get(`https://auto-delete-messages-bot.herokuapp.com/`);
    
    const results = await db.getDataByUniqId(req);
    if (results.total > 0) {
        const intentUrl = results.data[0].org_url.replace(/(^\w+:|^)\/\//, '');
        res.render(path.join(__dirname + '/public/ejs/index.ejs'), {
            video: results.data[0].org_url,
            video_name: results.data[0].video_name,
            video_size: results.data[0].video_size != 0 ? func.formatBytes(results.data[0].video_size) : 'N/A',
            video_duration: results.data[0].video_duration != 0 ? func.secondsToHms(results.data[0].video_duration) : 'N/A',
            url: `intent://${intentUrl}#Intent;package=com.playit.videoplayer;action=android.intent.action.VIEW;scheme=http;type=video/mp4;end`
        });
    } else {
        res.send('File is removed or something went wrong with the file. Please contact owner !!');
    }
});

app.listen(process.env.PORT || 5000);

bot.catch((err, ctx) => {
    console.log('ctx--catch==========>', err);
    ctx.reply(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

/*

    BOT

*/

bot.start((ctx) => {
    ctx.reply(`Hi *${ctx.from.first_name}*!!\n\n🤖️ Official private bot of @temp\\_demo\nfor short URL to DropLink`, {
        parse_mode: 'markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📂 Join Our Main Channel", url: 'https://t.me/my_channels_list_official' }
                ],
                [
                    { text: "Help 💡️", callback_data: 'help' }
                ]
            ]
        }
    });
});

/*

    ADMIN ONLY COMMAND

*/

bot.command('create', async (ctx) => {
    const res = await client.query('CREATE TABLE tg_droplink_data (id SERIAL PRIMARY KEY, droplink VARCHAR, org_url VARCHAR, uniq_id VARCHAR)');
    console.log('res', res)
});

bot.command('delete', async (ctx) => {
    const res = await client.query('DROP TABLE IF EXISTS tg_droplink_data');
    console.log('res', res)
});

bot.command('get_by_id', async (ctx) => {
    const isAllowed = func.isAdmin(ctx);;
    if (!isAllowed.success) return ctx.reply(isAllowed.error);

    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08sdhnjZwT5fAfZJCkdVlH6NMIgLf-gACagQAAq_pGVaiHwGxKU30MCIE');
    const id = ctx.message.text.split('/get_by_id ')[1];

    const results = await db.getDataById({ params: { id: `${Number(id)}` } });
    ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);
    return func.sendReply(ctx, results);
});

bot.command('get_by_url', async (ctx) => {
    const isAllowed = func.isAdmin(ctx);;
    if (!isAllowed.success) return ctx.reply(isAllowed.error);

    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08sdhnjZwT5fAfZJCkdVlH6NMIgLf-gACagQAAq_pGVaiHwGxKU30MCIE');
    const url = ctx.message.text.split('/get_by_url ')[1];

    const results = await db.getDataByOrgUrl({ params: { url: `${url}` } });
    ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);
    return func.sendReply(ctx, results);
});

bot.command('get_by_droplink', async (ctx) => {
    const isAllowed = func.isAdmin(ctx);;
    if (!isAllowed.success) return ctx.reply(isAllowed.error);

    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08sdhnjZwT5fAfZJCkdVlH6NMIgLf-gACagQAAq_pGVaiHwGxKU30MCIE');
    const droplink = ctx.message.text.split('/get_by_droplink ')[1];

    const results = await db.getDataByDroplink({ params: { droplink: `${droplink}` } });
    ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);
    return func.sendReply(ctx, results);
});

bot.command('get_by_uniqid', async (ctx) => {
    const isAllowed = func.isAdmin(ctx);;
    if (!isAllowed.success) return ctx.reply(isAllowed.error);

    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08sdhnjZwT5fAfZJCkdVlH6NMIgLf-gACagQAAq_pGVaiHwGxKU30MCIE');
    const uniqId = ctx.message.text.split('/get_by_uniqid ')[1];

    const results = await db.getDataByUniqId({ params: { id: `${uniqId}` } });
    ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);
    return func.sendReply(ctx, results);
});

bot.command('update_data', async (ctx) => {
    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08vdhnjeGdMhMHh4XH1PpyRoBQVba7AACrwEAAkglCVeK2COVlaQ2mSIE');
    
    const params = ctx.message.text.split('  ');
    const video_name = ctx.message.reply_to_message.video.file_name;
    const video_size = ctx.message.reply_to_message.video.file_size;
    const video_duration = ctx.message.reply_to_message.video.duration;
    const droplink = params[1]
    const org_url = params[2];
    const uniq_id = params[3];
    const id = params[4];

    const results = await db.updateData({ body: [droplink, org_url, uniq_id, video_name, video_size, video_duration, id] });
    ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);

    if (results.error) {
        return ctx.reply(results.error.msg);
    }
    ctx.reply('Successfully Updated !!');
});

bot.command('update_data_by', async (ctx) => {
    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08vdhnjeGdMhMHh4XH1PpyRoBQVba7AACrwEAAkglCVeK2COVlaQ2mSIE');
    
    const params = ctx.message.text.split('  ');
    const update_data_by = params[1];
    const update_data_value = params[2];
    const id = parseInt(params[3]);

    const results = await db.updateDataBy({ body: [update_data_by, update_data_value, id] });
    console.log('update-resylts', results);
    ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);

    if (results.error) {
        return ctx.reply(results.error.msg);
    }
    ctx.reply(`Successfully updated ${update_data_by} field!!`);
});

bot.command('delete_data', async (ctx) => {
    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08vdhnjeGdMhMHh4XH1PpyRoBQVba7AACrwEAAkglCVeK2COVlaQ2mSIE');
    const id = ctx.message.text.split('/delete_data ')[1];

    const results = await db.deleteData({ params: { id: `${Number(id)}` } });
    ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);

    if (results.error) {
        return ctx.reply(results.error.msg);
    }
    ctx.reply('Successfully deleted !!');
});

bot.command('get_all_data', async (ctx) => {
    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08sdhnjZwT5fAfZJCkdVlH6NMIgLf-gACagQAAq_pGVaiHwGxKU30MCIE');

    const results = await db.getData();
    ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);

    if (results.error) {
        return ctx.reply(results.error.msg);
    }
    if (results.total > 0) {
        ctx.reply('you got your results in response !!!');
        console.log('results', results.data)
    } else {
        ctx.reply('No results found !!');
    }
});

/*

    USER COMMAND

*/

bot.command('animation_to_photo', (ctx) => {
    if (!ctx.message || !ctx.message.reply_to_message || !ctx.message.reply_to_message.caption) return;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const shortURL = ctx.message.reply_to_message.caption.match(urlRegex);
    
    const isMdiskPost = ctx.message.reply_to_message.caption.includes('Mdisk');
    const hasScreenshot = ctx.message.reply_to_message.caption.includes('Screenshots');

    if (shortURL === null) return ctx.replace('Something wrong with the url !!');

    const fileUrl = ctx.message.text.split(' ')[1] || 'https://telegra.ph/file/66a8bf28af4180fad2e70.jpg';
    const method = isMdiskPost ? func.getMdiskCaption : func.getCaption;

    ctx.telegram.sendPhoto(ctx.chat.id, fileUrl,
        {
            caption: method(shortURL[1], 'https://t.me/joinchat/ojOOaC4tqkU5MTVl', (isMdiskPost && hasScreenshot)),
            parse_mode: isMdiskPost ? 'MarkdownV2' : 'markdown'
        }
    );
});

bot.command('convert_to_text', (ctx) => {
    if (!ctx.message || !ctx.message.reply_to_message || !ctx.message.reply_to_message.caption) return;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const shortURL = ctx.message.reply_to_message.caption.match(urlRegex);
    
    const isMdiskPost = ctx.message.reply_to_message.caption.includes('Mdisk');
    const hasScreenshot = ctx.message.reply_to_message.caption.includes('Screenshots');

    if (shortURL === null) return ctx.replace('Something wrong with the url !!');
    const method = isMdiskPost ? func.getMdiskCaption : func.getCaption;

    ctx.reply(method(shortURL[1], 'https://t.me/joinchat/ojOOaC4tqkU5MTVl', (isMdiskPost && hasScreenshot)),
        {
            parse_mode: isMdiskPost ? 'MarkdownV2' : 'markdown',
            disable_web_page_preview: true
        }
    );
});

bot.command('add_screenshot_link', (ctx) => {
    if (!ctx.message || !ctx.message.reply_to_message || !ctx.message.reply_to_message.caption) return;
    
    const screenshotLink = ctx.message.text.split(' ')[1];
    if (!screenshotLink) return;
    
    const isMdiskPost = ctx.message.reply_to_message.caption.includes('Mdisk');
    const repliedCaption = ctx.message.reply_to_message.caption;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const allURLs = repliedCaption.match(urlRegex);
    
    const captionMethod = isMdiskPost ? func.getMdiskCaption : func.getCaption;
    
    let newMessage = captionMethod(allURLs[1], 'https://t.me/joinchat/ojOOaC4tqkU5MTVl', true);
    newMessage = newMessage.replace('Replace\\_Link', func.regExpEscape(screenshotLink));
    
    const method = ctx.message.reply_to_message.photo ? 'sendPhoto' : 'sendAnimation';
    let messageLink = 'https://telegra.ph/file/b23b9e5ed1107e8cfae09.mp4';
    if (ctx.message.reply_to_message.photo) messageLink = ctx.message.reply_to_message.photo[ctx.message.reply_to_message.photo.length - 1].file_id; 
    
    ctx.telegram[method](ctx.chat.id, messageLink,
        {
            caption: newMessage,
            parse_mode: isMdiskPost ? 'MarkdownV2' : 'markdown'
        }
    );
});

bot.command(['mdisk', 'mdisk_ss'], async (ctx) => {
    const isAllowed = func.isAdmin(ctx);;
    if (!isAllowed.success) return ctx.reply(isAllowed.error);
    
    let mdiskLink = ctx.message.text.split(' ')[1];
    let mdiskURL = '';
    let messageLink = 'https://telegra.ph/file/b23b9e5ed1107e8cfae09.mp4';

    if (ctx.message.reply_to_message) {
        const repliedMessage = ctx.message.reply_to_message.caption || ctx.message.reply_to_message.text;
        mdiskURL = repliedMessage.match(/(https?:\/\/mdisk[^\s]+)/g);

        if (mdiskURL !== null) {
            const params = {
                token: ctx.from.id === 1532971861 ? process.env.MDISK_TOKEN : process.env.MDISK_TOKEN1,
                link: mdiskURL[0]
            };
            try {
                const respo = await axios.post('https://diskuploader.mypowerdisk.com/v1/tp/cp', params);
                if (respo.status === 200) mdiskLink = respo.data.sharelink;
            }
            catch(error) {
                throw error;
            }
            if (ctx.message.reply_to_message.photo) messageLink = ctx.message.reply_to_message.photo[ctx.message.reply_to_message.photo.length - 1].file_id;
            else messageLink = func.getPostImage();
        }
    }

    if (!mdiskLink) return ctx.reply('No URL Found !!');

    const method = ctx.message.reply_to_message ? 'sendPhoto' : 'sendAnimation';
    ctx.telegram[method](ctx.chat.id, messageLink,
            {
                caption: `${func.getMdiskCaption(mdiskLink, 'https://t.me/joinchat/ojOOaC4tqkU5MTVl', ctx.message.text.includes('mdisk_ss'))}`,
                parse_mode: 'MarkdownV2'
            }
    );
});

const https = require('https');

bot.command('hello', async (ctx) => {
    const url = ctx.message.text.split(' ')[1];
    console.log('url===', url);
    const params = {
        api: '8877d9afc0127597a60bc91b53d0df5e66691582',
        url: url
    };
    try {
        const response = await https.get(`https://shorturllink.in/api?api=8877d9afc0127597a60bc91b53d0df5e66691582&url=${params.url}`);
        console.log('res---hrllo', response)
    }
    catch(err) {
        console.log('err==hrloo', err)
    }
});

bot.command(['short_to_droplink', 'short_to_shorturllink'], async (ctx) => {
    const isAllowed = func.isAdmin(ctx);;
    if (!isAllowed.success) return ctx.reply(isAllowed.error);

    await ctx.telegram.sendAnimation(ctx.chat.id, 'CAACAgUAAxkBAAE08vdhnjeGdMhMHh4XH1PpyRoBQVba7AACrwEAAkglCVeK2COVlaQ2mSIE');

    let video_name = 'Telegram : @my_channels_list_official';
    let video_size = 0;
    let video_duration = 0;

    if (ctx.message.reply_to_message && ctx.message.reply_to_message.video) {
        video_name = ctx.message.reply_to_message.video.file_name ? ctx.message.reply_to_message.video.file_name : video_name;
        video_size = ctx.message.reply_to_message.video.file_size;
        video_duration = ctx.message.reply_to_message.video.duration;
    }

    if ((ctx.message.text).includes('note')) return ctx.reply('note accepted');

    const URL = ctx.message.text.split(' ')[1];
    const URL2 = ctx.message.text.split(' ')[2] || '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const shortURL = ctx.message.text.match(urlRegex);

    if (shortURL !== null && shortURL.length) {
        const isDropLink = ctx.message.text.includes('droplink');
        
        // check in db exists or not
        const results = await db.getDataByOrgUrl({ params: { url: `${isDropLink ? URL : URL2}` } });
        if (results.error) {
            return ctx.reply(results.error.msg);
        }
        if (results.total > 0) return func.sendReply(ctx, results);

        const uniqID = (new Date()).getTime().toString(36);
        const linkToShort = `https://droplink-bot.herokuapp.com/${uniqID}`;

        const token = isDropLink ? process.env.DROPLINK_API_TOKEN : process.env.SHORTURLLINK_API_TOKEN;
        const endpoint = isDropLink ? 'droplink.co' : 'shorturllink.in';
        const apiURL = `https://${endpoint}/api?api=${token}&url=${linkToShort}`;
        
        try {
            const response = isDropLink ? await axios.get(apiURL) : { data: { status: 'success', shortenedUrl: URL } };
            if (response.data.status === 'success') {
                db.createData({ body: [response.data.shortenedUrl, (isDropLink ? URL : URL2), uniqID, video_name, video_size, video_duration] })
                    .then(async (res) => {
                        if (res.err) {
                            ctx.reply('Something went wrong !!');
                            return console.log('errr', err);
                        }
                        ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);
                        await ctx.telegram.sendAnimation(ctx.chat.id, 'https://telegra.ph/file/b23b9e5ed1107e8cfae09.mp4',
                            {
                                caption: func.getCaption(response.data.shortenedUrl, 'https://t.me/joinchat/ojOOaC4tqkU5MTVl', true),
                                parse_mode: 'markdown'
                            }
                        );
                        const messageDetails = [
                            { 
                                uniq_id: uniqID,
                                org_url: (isDropLink ? URL : URL2),
                                droplink: response.data.shortenedUrl, 
                                video_name: video_name,
                                video_size: video_size,
                                video_duration: video_duration
                            }
                        ];
                        return await func.sendReply(ctx, { data: messageDetails, total: 1 });
                    })
                    .catch(err => {
                        ctx.reply(`error===${err}`);
                    });
            }
        }
        catch (err) {
            throw err;
        }
    } else {
        ctx.reply('Please send a valid link to be shorten !!!')
    }
});

/*

    FFMPEG

*/

bot.command('ffmpeg2', async (ctx) => {
    const isAllowed = func.isAdmin(ctx);;
    if (!isAllowed.success) return ctx.reply(isAllowed.error);
    
    const URL = ctx.message.text.split(' ')[1];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const shortURL = URL.match(urlRegex);
    console.log('shortURL======', shortURL);
    
    if (shortURL === null) return ctx.reply('Send valid link to generate screenshots !!');
    await ctx.reply('Getting ready to generate screenshots !!');
    
    if(!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    };
    
    let myScreenshots = [];

    try {
        ffmpeg(shortURL[0])
        .on('progress', function(progress) {
            console.log('progress====', progress)
            console.log('Processing: ' + progress.percent + '% done');
        })
        .on('filenames', function(filenames) {
            myScreenshots = filenames;
         })
        .on('end', async function() {
            console.log('Screenshots taken');
            ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id + 1);
            const media = myScreenshots.map(ss => {
                return {
                    type: 'photo',
                    media: { source : path.join(__dirname + `/downloads/${ss}`)},
                    caption: ss
                }
            });
            await ctx.telegram.sendMediaGroup(ctx.chat.id, media);
         })
        .on('error', function(err) {
            console.error(err);
         })
        .screenshots({
            count: process.env.SCREENSHOTS_COUNT,
            folder: './downloads/'
        });
    }
    catch (error){
        console.log('try-catch-error',error)
    }  
});

bot.launch();
