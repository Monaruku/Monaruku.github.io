// TikTok Video Publishing in JavaScript
class Fields {
    // Static field constants
    static POST_INFO = 'post_info';
    static PRIVACY_LEVEL = 'privacy_level';
    static TITLE = 'title';
    static VIDEO_COVER_TIMESTAMP_MS = 'video_cover_timestamp_ms';
    static SOURCE_INFO = 'source_info';
    static SOURCE = 'source';
    static VIDEO_URL = 'video_url';
}

class Post {
    constructor(config) {
        this.accessToken = config.access_token;
        // Updated to correct TikTok video publishing endpoint
        this.apiBaseUrl = 'https://open.tiktokapis.com/v2/video/publish/';
    }

    async publish(params) {
        try {
            // Use a more reliable approach without CORS proxy
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(params),
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(10000) // 10-second timeout
            });

            // Better error handling
            if (!response.ok) {
                const errorText = await response.text();
                console.error('TikTok API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    response: errorText
                });
                throw new Error(`TikTok API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timed out');
                throw new Error('Request to TikTok API timed out. Please try again later.');
            }
            console.error('Error publishing video to TikTok:', error);
            throw error;
        }
    }
}

// Usage example
async function publishVideoToTikTok() {
    try {
        // Get token from localStorage with error handling
        const accessToken = localStorage.getItem('tiktokAccessToken');
        if (!accessToken) {
            throw new Error('No access token found. Please authenticate with TikTok first.');
        }

        // Instantiation config params
        const config = {
            access_token: accessToken
        };

        // Instantiate a new post
        const post = new Post(config);

        const params = {
            [Fields.POST_INFO]: JSON.stringify({
                [Fields.PRIVACY_LEVEL]: 'PUBLIC', // Changed to PUBLIC for visibility
                [Fields.TITLE]: 'SQL BOLEH!!!',
                [Fields.VIDEO_COVER_TIMESTAMP_MS]: 1000
            }),
            [Fields.SOURCE_INFO]: JSON.stringify({
                [Fields.SOURCE]: 'PULL_FROM_URL',
                [Fields.VIDEO_URL]: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            })
        };

        // Post video to TikTok
        const publish = await post.publish(params);
        console.log('Video published successfully:', publish);
        return publish;
    } catch (error) {
        console.error('Failed to publish video:', error);
        throw error;
    }
}

// Call the function when needed
// publishVideoToTikTok().then(result => console.log(result));