// TikTok Authentication in JavaScript
class Authentication {
    constructor(config) {
        this.clientKey = config.client_key;
        this.clientSecret = config.client_secret;
    }

    getAuthenticationUrl(redirectUri, scopes) {
        // Create base URL for TikTok OAuth
        const baseUrl = 'https://www.tiktok.com/v2/auth/authorize/';

        // Build query parameters
        const params = new URLSearchParams({
            client_key: this.clientKey,
            redirect_uri: redirectUri,
            scope: scopes.join(','),
            response_type: 'code',
            state: this.generateRandomState()
        });

        return `${baseUrl}?${params.toString()}`;
    }

    // Helper method to generate a random state parameter for security
    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
}

// Usage example
// document.addEventListener('DOMContentLoaded', () => {
//     // Instantiate authentication
//     const authentication = new Authentication({
//         client_key: 'sbawgv8e7j4nbi22wy', 
//         client_secret: 'a9UD0KvMZd3XZHie9K6zLYNvndnFDhNf'
//     });

//     // URI TikTok will send the user to after they login
//     // Must match what you have in your app dashboard
//     const redirectUri = 'https://path/to/tiktok/login/redirect.html';

//     // A list of approved scopes by TikTok for your app
//     const scopes = [
//         'user.info.basic',
//         'video.upload'
//     ];

//     // Get TikTok login URL
//     const authenticationUrl = authentication.getAuthenticationUrl(redirectUri, scopes);

//     // Create login button with TikTok branding
//     const loginButton = document.getElementById('tiktok-login-button');
//     if (loginButton) {
//         loginButton.href = authenticationUrl;
//     }
// });