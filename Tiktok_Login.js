// TikTok Authentication in JavaScript
class Authentication {
    constructor(config) {
        this.clientKey = config.client_key;
        this.clientSecret = config.client_secret;
        this.tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/'; 
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
    
    async getAccessTokenFromCode(code, redirectUri) {
        try {
            // Prepare request body
            const params = new URLSearchParams({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            });

            // Make POST request to token endpoint
            const response = await fetch(this.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting access token:', error);
            throw error;
        }
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