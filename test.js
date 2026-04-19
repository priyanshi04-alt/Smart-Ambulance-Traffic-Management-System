const puppeteer = require('puppeteer');

(async () => {
    const wait = (ms) => new Promise(res => setTimeout(res, ms));
    
    try {
        console.log('Starting UI Test...');
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        const page = await browser.newPage();
        await page.setViewport({width: 1280, height: 800});
        
        console.log('Navigating to http://localhost:3000...');
        try {
            await page.goto('http://localhost:3000', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
        } catch (gotoErr) {
            console.error('Navigation failed. Taking screenshot of failure state...');
            await page.screenshot({path: 'failure_navigation.png'});
            throw gotoErr;
        }
        
        console.log('Page loaded. Waiting 2s...');
        await wait(2000);
        await page.screenshot({path: 'login_fixed.png', fullPage: true});
        
        console.log('Attempting login as driver1...');
        await page.type('#username', 'driver1');
        await page.type('#password', 'password123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        console.log('Waiting for dashboard visibility...');
        await page.waitForFunction(() => {
            const login = document.getElementById('loginScreen');
            return login && login.classList.contains('hidden');
        }, { timeout: 15000 });
        
        console.log('Dashboard active. Waiting for rendering...');
        await wait(3000); 
        await page.screenshot({path: 'driver_fixed.png', fullPage: true});
        
        await browser.close();
        console.log('Test completed successfully. Screenshots saved.');
    } catch (err) {
        console.error('CRITICAL TEST FAILURE:', err);
        process.exit(1);
    }
})();
