// TikTok Authentication in JavaScript
class Authentication {
    constructor(config) {
        this.clientKey = config.client_key;
        this.clientSecret = config.client_secret;
        this.tokenEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/';
        this.revokeEndpoint = 'https://open.tiktokapis.com/v2/oauth/revoke/';
        this.refreshEndpoint = 'https://open.tiktokapis.com/v2/oauth/token/';
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
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + this.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
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

    // Check token validity
    checkTikTokToken() {
        const token = localStorage.getItem('tiktokAccessToken');
        const tokenExpiry = localStorage.getItem('tiktokTokenExpiry');

        // Check if token exists and is still valid
        if (!token || !tokenExpiry || Date.now() > parseInt(tokenExpiry)) {
            // Token is expired or doesn't exist
            localStorage.removeItem('tiktokAccessToken');
            localStorage.removeItem('tiktokTokenExpiry');
            return false;
        }
        return true;
    }

    async refreshToken(accessToken) {
        try {
            const params = new URLSearchParams({
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: accessToken
            });

            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + this.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache'
                },
                body: params
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Refresh failed: ${errorData.error_description || `HTTP error ${response.status}`}`);
            }

            const tokenData = await response.json();

            if (tokenData.access_token) {
                localStorage.setItem('tiktokAccessToken', tokenData.access_token);
                // Calculate expiry time (current time + expires_in seconds)
                const expiryTime = Date.now() + (tokenData.expires_in * 1000);
                localStorage.setItem('tiktokTokenExpiry', expiryTime);

                // Store the new refresh token as well
                if (tokenData.refresh_token) {
                    localStorage.setItem('tiktokRefreshToken', tokenData.refresh_token);
                }
            }

            return tokenData;
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    }
    
    async revokeToken(accessToken) {
        try {
            // Create form data for the request
            const params = new URLSearchParams();
            params.append('client_key', this.clientKey);
            params.append('client_secret', this.clientSecret);
            params.append('token', accessToken);

            // Make the revocation request
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + this.revokeEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache'
                },
                body: params
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Revocation failed: ${errorData.error_description || 'Unknown error'}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error revoking token:', error);
            throw error;
        }
    }

    async getUserInfo(accessToken, fields = ['open_id', 'union_id', 'avatar_url', 'display_name']) {
        try {
            const fieldsParam = fields.join(',');
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const url = `https://open.tiktokapis.com/v2/user/info/?fields=${fieldsParam}`;

            const response = await fetch(corsProxy + url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to get user info: ${errorData.error?.message || `HTTP error ${response.status}`}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting user info:', error);
            throw error;
        }
    }
}