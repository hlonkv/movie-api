const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const app = express();
app.get('/api', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    let browser = null;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 });
        const links = await page.evaluate(() => {
            let extractedLinks = [];
            document.querySelectorAll('a[href], button').forEach(a => {
                let href = a.href || '';
                let text = (a.innerText || '').toLowerCase();
                if(href.includes('fsl') || href.includes('pixeldrain') || text.includes('download') || text.includes('server')) {
                    extractedLinks.push({ name: a.innerText.trim() || 'Download', url: href });
                }
            });
            return extractedLinks;
        });
        res.json({ success: true, links: links });
    } catch (error) {
        res.status(500).json({ error: 'Failed', details: error.message });
    } finally {
        if (browser) await browser.close();
    }
});
module.exports = app;
