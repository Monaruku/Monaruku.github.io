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

    initializeDisclosureControls();
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

            const privacyLevel = privacyLevelDropdown.value;
            const videoTitle = videoTitleInput.value || 'SQL BOLEH!!!';

            const isDisableComment = !allowCommentCheckbox.checked;
            const isDisableDuet = !allowDuetCheckbox.checked;
            const isDisableStitch = !allowStitchCheckbox.checked;

            const commercialDisclosure = document.getElementById('commercialDisclosure');
            const yourBrand = document.getElementById('yourBrand');
            const brandedContent = document.getElementById('brandedContent');

            if (commercialDisclosure.checked && !yourBrand.checked && !brandedContent.checked) {
                showError('Please indicate if your content promotes yourself, a third party, or both');
                return;
            }

            // Disable the post button to prevent multiple submissions
            disableButton();

            // Add commercial disclosure info
            const isBrandOrganic = commercialDisclosure.checked && yourBrand.checked;
            const isBrandedContent = commercialDisclosure.checked && brandedContent.checked;

            statusMessage.style.display = 'none'; // Hide any previous messages0
            const publishResponse = await publishVideoToTikTok(
                privacyLevel, 
                videoTitle, 
                isDisableComment, 
                isDisableDuet, 
                isDisableStitch,
                isBrandOrganic,
                isBrandedContent
            );
            console.log('Initial Publish response:', publishResponse);

            showInfo('Publishing video... Please wait.');
            // showSuccess('Content successfully published to TikTok! \n' +
            //     'It may take a few minutes to visible in your profile.\n' +
            //     'You will be redirected to TikTok shortly.'
            // );
            const publishId = publishResponse.data.publish_id;

            // Check publish status
            const statusResponse = await checkPublishStatus(publishId);
            console.log("Status response: ", statusResponse);

            if (statusResponse.data.status === 'PUBLISH_COMPLETE') {
                showSuccess('Content successfully published to TikTok! Redirecting to your profile...');
                // Redirect to TikTok after a short delay
                const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                setTimeout(() => {
                    if (isMobileDevice) {
                        window.location.href = 'snssdk1233://user/profile';
                    } else {
                        window.location.href = 'https://www.tiktok.com/@sqlaccounthq_oe';
                    }
                }, 3000);
            }
        } catch (error) {
            showError('Failed to publish video: ' + error.message);
            console.error('Error:', error);
        } finally {
            enableButton();
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

    function showInfo(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message info';
        statusMessage.style.display = 'block';
    }

    function disableButton() {
        postButton.disabled = true;
        postButton.textContent = 'Publishing...';
        postButton.style.opacity = 0.5;
        postButton.style.cursor = 'not-allowed';
    }

    function enableButton() {
        postButton.disabled = false;
        postButton.textContent = 'Post to TikTok';
        postButton.style.opacity = 1;
        postButton.style.cursor = 'pointer';
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

    function initializeDisclosureControls() {
        const commercialDisclosure = document.getElementById('commercialDisclosure');
        const brandOptions = document.getElementById('brandOptions');
        const yourBrand = document.getElementById('yourBrand');
        const brandedContent = document.getElementById('brandedContent');
        const privacyLevel = document.getElementById('privacyLevel');
        const postButton = document.getElementById('postVideoButton');
        const disclosureMessage = document.getElementById('disclosureMessage');
        const privacyTooltip = document.getElementById('privacyTooltip');

        // Toggle disclosure options
        commercialDisclosure.addEventListener('change', function () {
            if (this.checked) {
                brandOptions.style.display = 'block';
                validateDisclosureOptions();
            } else {
                brandOptions.style.display = 'none';
                enablePostButton();
                clearMessage();
            }
        });

        // Handle brand option changes
        yourBrand.addEventListener('change', validateDisclosureOptions);
        brandedContent.addEventListener('change', function () {
            validateDisclosureOptions();
            updatePrivacyOptions();
        });

        // Validate privacy level when it changes
        privacyLevel.addEventListener('change', function () {
            if (brandedContent.checked && this.value === 'SELF_ONLY') {
                this.value = 'PUBLIC_TO_EVERYONE';
                alert('Privacy level automatically changed to public as branded content cannot be private.');
            }
        });

        // Hover effect for privacy level when branded content is selected
        privacyLevel.addEventListener('mouseover', function () {
            if (brandedContent.checked) {
                privacyTooltip.style.display = 'block';
            }
        });

        privacyLevel.addEventListener('mouseout', function () {
            privacyTooltip.style.display = 'none';
        });

        function validateDisclosureOptions() {
            if (commercialDisclosure.checked && !yourBrand.checked && !brandedContent.checked) {
                disablePostButton("You need to indicate if your content promotes yourself, a third party, or both");              
            } else if (commercialDisclosure.checked) {
                enablePostButton();
            }
            updateDisclosureMessage();
        }

        function updatePrivacyOptions() {
            // Get all options in the privacy dropdown
            const options = privacyLevel.querySelectorAll('option');

            options.forEach(option => {
                if (option.value === 'SELF_ONLY' && brandedContent.checked) {
                    option.disabled = true;
                    option.title = "Branded content visibility cannot be set to private";
                } else {
                    option.disabled = false;
                    option.title = "";
                }
            });

            // If currently selected option is private and branded content is checked, change to public
            if (privacyLevel.value === 'SELF_ONLY' && brandedContent.checked) {
                privacyLevel.value = 'PUBLIC_TO_EVERYONE';
                alert('Privacy level automatically changed to public as branded content cannot be private.');
            }
        }

        function updateDisclosureMessage() {
            const fixedMsg = "This cannot be changed once your video is posted.";
            if ((yourBrand.checked && brandedContent.checked) || brandedContent.checked) {
                setMessage("Your video will be labeled as 'Paid partnership'.\n" + fixedMsg);
            } else if (yourBrand.checked) {
                setMessage("Your video will be labeled as 'Promotional content'.\n" + fixedMsg);
            } else {
                clearMessage();
            }
        }

        function setMessage(msg) {
            disclosureMessage.textContent = msg;
            disclosureMessage.style.display = 'block';
        }

        function clearMessage() {
            disclosureMessage.textContent = '';
            disclosureMessage.style.display = 'none';
        }

        function disablePostButton(reason) {
            postButton.disabled = true;
            postButton.title = reason;
            postButton.classList.add('disabled-button');
        }

        function enablePostButton() {
            postButton.disabled = false;
            postButton.title = '';
            postButton.classList.remove('disabled-button');
        }
    }

    
});