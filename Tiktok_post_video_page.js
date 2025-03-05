document.addEventListener('DOMContentLoaded', async function () {
    const postButton = document.getElementById('postVideoButton');
    const logoutButton = document.getElementById('logoutButton');
    const statusMessage = document.getElementById('statusMessage');
    const videoTitleInput = document.getElementById('videoTitle');
    
    const redirect_uri = 'https://monaruku.github.io/tiktok_post_vid.html';

    // Check if there's an access token in localStorage
    const hasAccessToken = localStorage.getItem('tiktokAccessToken');
    if (!hasAccessToken) {
        logoutButton.style.display = 'none';
    }

    // Initialize Authentication class for token revocation
    const authentication = new Authentication({
        client_key: 'sbawgv8e7j4nbi22wy',
        client_secret: 'a9UD0KvMZd3XZHie9K6zLYNvndnFDhNf'
    });

    // Token retrieval from URL code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !localStorage.getItem('tiktokAccessToken')) {
        try {
            const tokenFromCode = await authentication.getAccessTokenFromCode(code, redirect_uri);
            console.log('Access token from code:', tokenFromCode);
            // Access token from the response
            const userToken = tokenFromCode.access_token;
            // Store the token for later use
            localStorage.setItem('tiktokAccessToken', userToken);

            // Clear the 'code' parameter from the URL without refreshing the page
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            history.replaceState({}, document.title, url.toString());

            console.log('Access token retrieved successfully');
            alert('Authentication successful!');

            // Show logout button as we're now logged in
            logoutButton.style.display = 'block';
        } catch (error) {
            console.error('Authentication failed:', error);
            alert('Authentication failed. Please try again.');
        }
    }

    // Logout button functionality
    logoutButton.addEventListener('click', async function () {
        try {
            const accessToken = localStorage.getItem('tiktokAccessToken');

            if (!accessToken) {
                showError('No access token found. You are not logged in to TikTok.');
                return;
            }

            // Use the authentication class to revoke the token
            const result = await authentication.revokeToken(accessToken);

            // Clear the token from storage
            localStorage.removeItem('tiktokAccessToken');
            showSuccess('Successfully logged out from TikTok!');

            // Hide logout button
            logoutButton.style.display = 'none';

            // Optionally, redirect after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            showError('Failed to logout: ' + error.message);
            console.error('Error revoking token:', error);
        }
    });

    // Post video functionality
    postButton.addEventListener('click', async function () {
        try {
            // Get access token from local storage
            const accessToken = localStorage.getItem('tiktokAccessToken');

            if (!accessToken) {
                showError('No access token found. Please authenticate with TikTok first.');
                return;
            }

            // Create a new Post instance
            const post = new Post({
                access_token: accessToken
            });

            // Get the video title
            const videoTitle = videoTitleInput.value || 'SQL BOLEH!!!';

            // Set up parameters for video posting
            const params = {
                [Fields.POST_INFO]: JSON.stringify({
                    [Fields.PRIVACY_LEVEL]: 'PUBLIC',
                    [Fields.TITLE]: videoTitle,
                    [Fields.VIDEO_COVER_TIMESTAMP_MS]: 1000
                }),
                [Fields.SOURCE_INFO]: JSON.stringify({
                    [Fields.SOURCE]: 'PULL_FROM_URL',
                    [Fields.VIDEO_URL]: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                })
            };

            // Publish the video
            const result = await post.publish(params);

            // Show success message
            showSuccess('Video published successfully to TikTok!');
            console.log('Publishing result:', result);

            // Open TikTok app or web
            const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobileDevice) {
                window.location.href = 'snssdk1233://user/profile';
            } else {
                window.location.href = 'https://www.tiktok.com/@sqlaccounthq_oe';
            }
        } catch (error) {
            showError('Failed to publish video: ' + error.message);
            console.error('Error:', error);
        }
    });

    function showSuccess(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message success';
        statusMessage.style.display = 'block';
    }

    function showError(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message error';
        statusMessage.style.display = 'block';
    }
});