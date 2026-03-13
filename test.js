const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1280, height: 800});
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);
    await page.screenshot({path: 'login_fixed.png', fullPage: true});
    
    await page.type('#username', 'driver1');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction('!document.getElementById("loginScreen") && document.getElementById("mainContent").classList.length > 0');
    await page.waitForTimeout(2000);
    await page.screenshot({path: 'driver_fixed.png', fullPage: true});
    
    await browser.close();
    console.log('Screenshots saved.');
})();
