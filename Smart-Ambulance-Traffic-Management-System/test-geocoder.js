const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1280, height: 800});
    await page.goto('http://localhost:3000');
    
    // Login as driver
    await page.waitForSelector('#username');
    await page.type('#username', 'driver1');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for map and geocoder to load
    await page.waitForSelector('.leaflet-control-geocoder');
    // Give map tiles time to load
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({path: 'driver_geocoder.png', fullPage: true});
    await browser.close();
    console.log('Screenshot saved to driver_geocoder.png');
})();
