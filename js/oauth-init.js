// ══════════════════════════════════════════════════════════════
// CS Sfaxien — OAuth Configuration (Google & Facebook)
// ══════════════════════════════════════════════════════════════
// Replace with your real credentials:
// Google: https://console.cloud.google.com/apis/credentials
// Facebook: https://developers.facebook.com/apps/

window.GOOGLE_CLIENT_ID = '903536167519-ok9i40vni7fnuejpokchq3tn2ub72lnd.apps.googleusercontent.com';
window.FACEBOOK_APP_ID = '1470461508050625';

// Load Google Identity Services SDK
(function() {
    if (!window.GOOGLE_CLIENT_ID) return;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
})();

// Load & init Facebook SDK
window.fbAsyncInit = function() {
    if (window.FACEBOOK_APP_ID) {
        FB.init({ appId: window.FACEBOOK_APP_ID, cookie: true, xfbml: true, version: 'v21.0' });
        console.log('[FB SDK] Initialized with appId:', window.FACEBOOK_APP_ID);
    }
};
(function() {
    if (!window.FACEBOOK_APP_ID) return;
    if (document.getElementById('facebook-jssdk')) return;
    const s = document.createElement('script');
    s.id = 'facebook-jssdk';
    s.src = 'https://connect.facebook.net/fr_FR/sdk.js';
    s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
    s.onerror = function() { console.error('[FB SDK] Failed to load'); };
    document.head.appendChild(s);
})();
