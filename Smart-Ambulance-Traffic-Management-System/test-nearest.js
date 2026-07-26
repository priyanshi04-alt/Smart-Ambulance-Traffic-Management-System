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
    
    // Wait for map and distances to calculate
    await page.waitForSelector('#hospitalSelect option');
    // Give map tiles time to load and OSRM route to draw
    await new Promise(r => setTimeout(r, 4000));
    
    await page.screenshot({path: 'driver_nearest_hospital.png', fullPage: true});
    await browser.close();
    console.log('Screenshot saved to driver_nearest_hospital.png');
})();
