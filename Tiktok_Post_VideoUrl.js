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
    static DISABLE_DUET = 'disable_duet';
    static DISABLE_STITCH = 'disable_stitch';
    static DISABLE_COMMENT = 'disable_comment';
    static BRAND_ORGANIC_TOGGLE = 'brand_organic_toggle';
    static BRAND_CONTENT_TOGGLE = 'brand_content_toggle';
}

class Post {
    constructor(config) {
        this.accessToken = config.access_token;
        // this.apiBaseUrl = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/';
        this.statusUrl = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
        this.postVideoUrl = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
        this.creatorInfo = null;
    }

    async getCreatorInfo() {
        try {
            //not done
            // const corsProxy = 'https://corsproxy.io/?url=';
            // const response = await fetch(corsProxy + encodeURIComponent(this.creatorInfoUrl), {
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + this.creatorInfoUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details available');
                throw new Error(`HTTP error!(${response.status}): ${errorText}`);
            }

            this.creatorInfo = await response.json();
            return this.creatorInfo;
        } catch (error) {
            if (error.name === 'TypeError') {
                throw new Error(`Network error: ${error.message} (Check CORS proxy availability)`);
            }
            throw error;
        }
    }

    async publish(params) {
        try {
            // const corsProxy = 'https://corsproxy.io/?url=';
            // const response = await fetch(corsProxy + encodeURIComponent(this.apiBaseUrl), {
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + this.postVideoUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(params)
            });
            console.log('Response : ', response);
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details available');
                const errorTextList = errorText.split('\"');
                switch (errorTextList[5]) {
                    case "spam_risk_too_many_posts":
                        throw new Error('You have reached the limit of posts you can make in a day. Please try again tomorrow.');
                    case "spam_risk_user_banned_from_posting":
                        throw new Error('You have been banned from posting. Please contact TikTok support for more information.');
                    case "reached_active_user_cap":
                        throw new Error('Daily publishing quota reached: The maximum number of users allowed to publish content via this application today has been reached. Please try again tomorrow when the quota resets.');
                    case "unaudited_client_can_only_post_to_private_accounts":
                        throw new Error("Unaudited client can only post to private accounts. Please choose 'Private - Only Me' as the privacy level.");
                    case "unaudited_client_can_only_post_to_private_accounts":
                }
                throw new Error(`HTTP error!(${response.status}): ${errorText}`);
                // throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Add API context to the error
            if (error.name === 'TypeError') {
                throw new Error(`Network error: ${error.message} (Check CORS proxy availability)`);
            }
            throw error;
        }
    }

    async requestPublishStatus(publishId) {
        try {
            const corsProxy = 'https://cors-anywhere.herokuapp.com/';
            const response = await fetch(corsProxy + this.statusUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    "publish_id": publishId
                })
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details available');
                throw new Error(`HTTP error!(${response.status}): ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError') {
                throw new Error(`Network error: ${error.message} (Check CORS proxy availability)`);
            }
            throw error;
        }
    }
}

// Usage example
async function publishVideoToTikTok(
    privacyLevel,
    videoTitle,
    isDisableComment,
    isDisableDuet,
    isDisableStitch,
    isBrandOrganic,
    isBrandedContent
) {
    // Instantiation config params
    const config = {
        access_token: localStorage.getItem('tiktokAccessToken'),
    };

    // Instantiate a new post
    const post = new Post(config);

    const videoElement = document.getElementById('videoPreview');
    const sourceElement = videoElement.querySelector('source');
    const videoUrl = sourceElement.src;

    const params = {
        [Fields.POST_INFO]: {
            [Fields.TITLE]: videoTitle,
            [Fields.PRIVACY_LEVEL]: privacyLevel,
            [Fields.DISABLE_DUET]: isDisableDuet,
            [Fields.DISABLE_COMMENT]: isDisableComment,
            [Fields.DISABLE_STITCH]: isDisableStitch,
            [Fields.VIDEO_COVER_TIMESTAMP_MS]: 1000, // spot in video to use as cover photo
            [Fields.BRAND_ORGANIC_TOGGLE]: isBrandOrganic,
            [Fields.BRAND_CONTENT_TOGGLE]: isBrandedContent
        },
        [Fields.SOURCE_INFO]: {
            [Fields.SOURCE]: 'PULL_FROM_URL',
            [Fields.VIDEO_URL]: videoUrl // video URL that TikTok verified 
        }
    };

    console.log('Param for publish : ', params);
    return await post.publish(params);
}

async function checkPublishStatus(publishId) {
    const maxAttempts = 10; // Maximum number of attempts
    const initialDelay = 2000; // Initial delay in milliseconds

    const config = {
        access_token: localStorage.getItem('tiktokAccessToken'),
    };

    // Instantiate a new post
    const post = new Post(config);

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        try {
            const statusResponse = await post.requestPublishStatus(publishId);
            console.log(`Status check attempt ${attempts}:`, statusResponse);

            if (!statusResponse || !statusResponse.data) {
                throw new Error('Invalid status response');
            }

            const status = statusResponse.data.status;

            if (status === 'PUBLISH_COMPLETE') {
                return statusResponse;
            } else if (status === 'FAILED') {
                // Publishing failed
                const failReason = statusResponse.data.fail_reason || 'Unknown reason';
                throw Error(`Publishing failed: ${failReason}`);
            } else {
                // Unknown status
                for (let i = 3; i > 0; i--) {
                    setTimeout(console.log(`Current status: ${status}. Checking again in ${i}...`), 1000);
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
            if (attempts >= maxAttempts - 1) {
                throw Error('Status check failed. Your video may still be processing. Check TikTok app later.');
            } else {
                for (let i = 3; i > 0; i--) {
                    setTimeout(console.log(`Error checking status: ${error.message}. Retrying in ${i}..`), 1000);
                }
            }
        }
    }

    return await post.requestPublishStatus(publishId);
}
// Call the function when needed
// publishVideoToTikTok().then(result => console.log(result));