document.addEventListener('DOMContentLoaded', async function () {
    const postButton = document.getElementById('postVideoButton');
    const logoutButton = document.getElementById('logoutButton');
    const statusMessage = document.getElementById('statusMessage');
    const videoTitleInput = document.getElementById('videoTitle');
    const privacyLevelDropdown = document.getElementById('privacyLevel');
    let creatorInfoResponse = null;
    let userInfoResponse = null;

    const allowCommentCheckbox = document.getElementById('allowComment');
    const allowDuetCheckbox = document.getElementById('allowDuet');
    const allowStitchCheckbox = document.getElementById('allowStitch');

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
            const tokenFromCode = await authentication.getAccessTokenFromCode(code, 'https://applecakes14.github.io/SQL-Link-Tree/tiktok_post_vid.html');
            console.log('Access token from code:', tokenFromCode);
            // Access token from the response
            const userToken = tokenFromCode.access_token;
            // Store the token for later use
            localStorage.setItem('tiktokAccessToken', userToken);
            localStorage.setItem('tiktokTokenExpiry', Date.now() + (tokenFromCode.expires_in * 1000));

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

    // Check if there's an access token in localStorage
    const accessToken = localStorage.getItem('tiktokAccessToken');
    if (!accessToken) {
        logoutButton.style.display = 'none';
    }
    else {
        // try {
        //     // Fetch user info
        //     const userInfoResponse = await authentication.getUserInfo(accessToken);

        //     if (userInfoResponse && userInfoResponse.data && userInfoResponse.data.user) {
        //         const user = userInfoResponse.data.user;

        //         // Update UI with user info
        //         const userProfile = document.getElementById('userProfile');
        //         const userAvatar = document.getElementById('userAvatar');
        //         const userName = document.getElementById('userName');

        //         // Set avatar and name
        //         userAvatar.src = user.avatar_url;
        //         userName.textContent = user.display_name;

        //         // Show profile section
        //         userProfile.style.display = 'flex';

        //         console.log('User profile loaded:', user);
        //     }
        // } catch (error) {
        //     console.error('Failed to load user profile:', error);
        //     alert('Failed to load user profile. Please try again.');
        // }

        try {
            // Fetch creator info
            creatorInfoResponse = await authentication.queryCreatorInfo(accessToken);

            if (creatorInfoResponse && creatorInfoResponse.data) {
                const creator = creatorInfoResponse.data;

                // Update UI with user info
                const userProfile = document.getElementById('userProfile');
                const userAvatar = document.getElementById('userAvatar');
                const userName = document.getElementById('userName');

                userAvatar.src = creator.creator_avatar_url;
                userName.textContent = creator.creator_nickname;

                // Show profile section
                userProfile.style.display = 'flex';

                // Populate privacy level options dropdown
                if (creator.privacy_level_options && creator.privacy_level_options.length > 0) {
                    // Clear any existing options except the placeholder
                    while (privacyLevelDropdown.options.length > 1) {
                        privacyLevelDropdown.remove(1);
                    }

                    // Add options from creator info
                    creator.privacy_level_options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;

                        // Format the option text to be more readable
                        let displayText;
                        switch (option) {
                            case 'PUBLIC_TO_EVERYONE':
                                displayText = 'Public - Everyone';
                                break;
                            case 'MUTUAL_FOLLOW_FRIENDS':
                                displayText = 'Friends - Mutual followers only';
                                break;
                            case 'SELF_ONLY':
                                displayText = 'Private - Only me';
                                break;
                            case 'FOLLOWER_OF_CREATOR':
                                displayText = 'Followers - Followers only';
                                break;
                            default:
                                displayText = option.replace(/_/g, ' ').toLowerCase()
                                    .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');
                        }

                        optionElement.textContent = displayText;
                        privacyLevelDropdown.appendChild(optionElement);
                    });

                    // Enable the dropdown
                    privacyLevelDropdown.disabled = false;
                } else {
                    // If no privacy options available, disable the dropdown
                    privacyLevelDropdown.disabled = true;
                    const optionElement = document.createElement('option');
                    optionElement.textContent = 'No privacy options available';
                    privacyLevelDropdown.appendChild(optionElement);
                }

                // Comment settings
                if (creator.comment_disabled) {
                    allowCommentCheckbox.disabled = true;
                    allowCommentCheckbox.checked = false;
                    allowCommentCheckbox.parentElement.title = "Comments are disabled in your TikTok app settings";
                } else {
                    allowCommentCheckbox.disabled = false;
                }

                // Duet settings
                if (creator.duet_disabled) {
                    allowDuetCheckbox.disabled = true;
                    allowDuetCheckbox.checked = false;
                    allowDuetCheckbox.parentElement.title = "Duets are disabled in your TikTok app settings";
                } else {
                    allowDuetCheckbox.disabled = false;
                }

                // Stitch settings
                if (creator.stitch_disabled) {
                    allowStitchCheckbox.disabled = true;
                    allowStitchCheckbox.checked = false;
                    allowStitchCheckbox.parentElement.title = "Stitches are disabled in your TikTok app settings";
                } else {
                    allowStitchCheckbox.disabled = false;
                }

                console.log('User profile loaded:', creator);
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
            alert('Failed to load user profile. Please try again.');
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
            console.log('Token revoked:', result);
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
            // Check if privacy level is selected
            if (!privacyLevelDropdown.value) {
                showError('Please select a privacy level');
                return;
            }
            // check whether user is able to post video
            if (!creatorInfoResponse || !creatorInfoResponse.data) {
                showError('Creator information not available. Please refresh and try again.');
                return;
            }

            const creator = creatorInfoResponse.data;

            const videoDuration = await getVideoDuration('videoPreview'); // Use correct ID
            console.log(`Video duration: ${videoDuration} seconds`);

            if (creator.max_video_post_duration_sec < videoDuration) {
                showError(`Sorry, you do not allowed to post. Video exceeds maximum allowed duration of ${creator.max_video_post_duration_sec} seconds by your account.`);
                return;
            }

            const disableComment = !allowCommentCheckbox.checked;
            const disableDuet = !allowDuetCheckbox.checked;
            const disableStitch = !allowStitchCheckbox.checked;

            const privacyLevel = privacyLevelDropdown.value;
            const videoTitle = videoTitleInput.value || 'SQL BOLEH!!!';

            await publishVideoToTikTok(privacyLevel, videoTitle, disableComment, disableDuet, disableStitch).then(result => console.log("Publish Video result: ", result));
            showSuccess('Video published successfully to TikTok!');

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

    function getVideoDuration(videoElementId) {
        return new Promise((resolve, reject) => {
            const videoElement = document.getElementById(videoElementId);

            if (!videoElement) {
                reject(new Error(`Video element with ID '${videoElementId}' not found`));
                return;
            }

            // If video metadata is already loaded, return duration immediately
            if (videoElement.readyState >= 1) {
                resolve(videoElement.duration);
                return;
            }

            // Otherwise, wait for metadata to load
            videoElement.addEventListener('loadedmetadata', () => {
                resolve(videoElement.duration);
            });

            // Handle errors
            videoElement.addEventListener('error', () => {
                reject(new Error('Failed to load video metadata'));
            });

            // Ensure video starts loading if it hasn't already
            if (videoElement.readyState === 0) {
                videoElement.load();
            }
        });
    }
});