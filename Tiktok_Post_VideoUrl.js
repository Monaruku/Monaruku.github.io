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
        this.apiBaseUrl = 'https://open.tiktokapis.com/v2/post/publish/';
    }

    async publish(params) {
        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error publishing video to TikTok:', error);
            throw error;
        }
    }
}

// Usage example
async function publishVideoToTikTok() {
    // Instantiation config params
    const config = {
        access_token: '<USER_ACCESS_TOKEN>',
    };

    // Instantiate a new post
    const post = new Post(config);

    const params = {
        [Fields.POST_INFO]: JSON.stringify({
            [Fields.PRIVACY_LEVEL]: 'SELF_ONLY',
            [Fields.TITLE]: 'SQL BOLEH!!!',
            [Fields.VIDEO_COVER_TIMESTAMP_MS]: 1000 // spot in video to use as cover photo
        }),
        [Fields.SOURCE_INFO]: JSON.stringify({
            [Fields.SOURCE]: 'PULL_FROM_URL',
            [Fields.VIDEO_URL]: '<VIDEO_URL>' // video URL that is publicly accessible
            // e.g. http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
        })
    };

    try {
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