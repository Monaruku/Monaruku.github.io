document.addEventListener("DOMContentLoaded",async function () {
    
    // Define the links
    const links = {
        'Facebook Page': 'https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/SQLEstream/',
        'Facebook': 'https://www.facebook.com/SQLEstream/',
        'FacebookIOS': 'fb://page/110600357296339',
        'Instagram': 'https://www.instagram.com/sqlestream/?hl=ms',
        'Google review': 'https://search.google.com/local/writereview?placeid=ChIJd904jxpTzDER2KhXom8b_zI',
        'Red note': 'Red note',
        'TikTok': 'TikTok',
        'Share': 'Share'
    };

    // Authentication class
    const authentication = new Authentication({
        client_key: 'sbawgv8e7j4nbi22wy',
        client_secret: 'a9UD0KvMZd3XZHie9K6zLYNvndnFDhNf'
    });

    // Must match what you have in your app dashboard
    const redirectUri = 'https://applecakes14.github.io/SQL-Link-Tree/tiktok_post_vid.html';

    const scopes = [
        'user.info.basic',
        'video.upload',
        'video.publish'
    ];

    // Get TikTok login URL
    const authenticationUrl = authentication.getAuthenticationUrl(redirectUri, scopes);

    //Share Stuff
    const imageURL = 'https://static.wixstatic.com/media/a4bb8c_3c067dae40a8430387b5b3fe904c9a62~mv2.png'
    const shareText = 'I have a good time here, thank you so much SQL! #SQLEStream'

    

    // const revokeButton = document.getElementById('tiktok-revoke-button');
    // if (!localStorage.getItem('tiktokAccessToken')) {
    //     revokeButton.style.display = 'none';
    // }
    // else {
    //     revokeButton.style.display = 'inline-block';
    //     // loginButton.style.display = 'none';
    // }
    // if (revokeButton) {
    //     revokeButton.addEventListener('click', async function () {
    //         try {
    //             const accessToken = localStorage.getItem('tiktokAccessToken');

    //             if (!accessToken) {
    //                 alert('No access token found. You are not logged in to TikTok.');
    //                 return;
    //             }

    //             // Use the authentication class method instead of direct fetch
    //             const result = await authentication.revokeToken(accessToken);

    //             // Clear the token from storage
    //             localStorage.removeItem('tiktokAccessToken');
    //             alert('Successfully logged out from TikTok!');
    //             window.location.reload();
    //         } catch (error) {
    //             console.error('Error revoking token:', error);
    //             alert('Failed to logout: ' + error.message);
    //         }
    //     });
    // }

    /**
    function shareToRedNote() {
    if (navigator.share) {
        navigator.share({
            url: 'https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605'
        }).catch(error => console.log('Error sharing:', error));
    } else {
        alert('Sharing not supported on this browser.');
    }
    */

    function copyText() {
        const text = "This place is good and helpful. Accounting made easy!";
        navigator.clipboard.writeText(text);
    }

    const loginButton = document.getElementById('tiktok-login-button');
    if (loginButton) {
        loginButton.href = authenticationUrl;
        // You can also create the button dynamically if needed:
        // const loginButton = document.createElement('a');
        // loginButton.href = authenticationUrl;
        // loginButton.innerHTML = '<img src="/path/to/tiktok/logo.png" alt="TikTok Logo"/> Continue With TikTok';
        // document.getElementById('login-container').appendChild(loginButton);
    }


    // Add active state for touch devices
    document.querySelectorAll('.action-button').forEach(button => {
        // Touch start - add active class
        button.addEventListener('touchstart', function () {
            this.classList.add('button-active');
        }, { passive: true });

        // Touch end - remove active class
        button.addEventListener('touchend', function () {
            this.classList.remove('button-active');
        }, { passive: true });

        // Click event
        button.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent triggering parent card click
            const platform = this.parentElement.querySelector('h3').textContent.trim();

            // Check if we have a dedicated link for this platform
            if (links[platform]) {
                if (links[platform] == 'Red note') {

                    //Check if the device have Rednote installed or not before redirecting
                    var fallbackToStore = function () {
                        window.location = 'https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605';
                    };
                    var openApp = function () {
                        window.location = 'xhsdiscover://user/60ba509f0000000001008605';
                    };

                    openApp();
                    setTimeout(fallbackToStore, 700);

                    //shareToRedNote();
                }
                //lazy way of doing this
                else if (links[platform] == links['Google review']) {
                    copyText();
                    alert("Text copied! Paste it onto Google Review.");
                    window.open(links['Google review'], '_blank');
                }
                else if (links[platform] == links['Facebook']) {
                    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

                    if (/android/i.test(userAgent)) {
                        window.open(links['Facebook'], '_blank');
                    }

                    // iOS detection from: http://stackoverflow.com/a/9039885/177710
                    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                        //Check if the device have Rednote installed or not before redirecting
                        var fallbackToStore = function () {
                            window.location = links['Facebook'];
                        };
                        var openApp = function () {
                            window.location = links['FacebookIOS'];
                        };

                        openApp();
                        setTimeout(fallbackToStore, 1700);


                        //window.open(links['FacebookIOS'], '_blank');
                    }
                }
                else if (links[platform] == links['TikTok']) {
                    var fallbackToStore = function () {
                        // window.location = 'https://www.tiktok.com/@sqlaccounthq_oe';
                        if (localStorage.getItem('tiktokAccessToken')) 
                            window.location.href = "tiktok_post_vid.html";
                        else 
                            window.location = authenticationUrl;
                    };
                    var openApp = function () {
                        // window.location = 'snssdk1233://user/profile/6988483642273219586';
                        if (localStorage.getItem('tiktokAccessToken'))
                            window.location.href = "tiktok_post_vid.html";
                        else
                            window.location = authenticationUrl;
                    };

                    openApp();
                    setTimeout(fallbackToStore, 700);
                }
                //how many else if do I need
                else if (links[platform] == links['Share']) {
                    //Copy Share Text
                    navigator.clipboard.writeText(shareText);
                    alert("Text copied! Please use it as the content for the post");
                    if (navigator.share) {
                        fetch(imageURL) // Replace with your image URL
                            .then(response => response.blob())
                            .then(blob => {
                                const file = new File([blob], 'image.jpg', { type: blob.type });

                                navigator.share({
                                    files: [file]
                                    //url: 'This is actually just plain text' //Somehow parsing my website url in it as well
                                }).then(() => {
                                    console.log('Content shared successfully!');
                                }).catch((error) => {
                                    console.error('Error sharing:', error);
                                });
                            }).catch(error => console.error('Error fetching image:', error));
                    } else {
                        alert('Web Share API is not supported in your browser.');
                    }
                }
                else {
                    window.open(links[platform], '_blank');
                }
            } else {
                const actionType = this.textContent;
                alert(`You are about to ${actionType.toLowerCase()} on ${platform}!`);
                // Here you would implement the functionality for other platforms
            }
        });
    });

    // Also add direct click functionality to the card for Facebook and Instagram
    // document.querySelectorAll('.card').forEach(card => {
    //     const platform = card.querySelector('h3').textContent.trim();

    //     if (links[platform]) {
    //         card.style.cursor = 'pointer';

    //         // Add tap/click functionality
    //         card.addEventListener('click', function (e) {
    //             // Only trigger if they didn't click the button directly
    //             if (!e.target.classList.contains('action-button')) {
    //                 window.open(links[platform], '_blank');
    //             }
    //         });

    //         // Add active state for touch
    //         card.addEventListener('touchstart', function () {
    //             if (!this.querySelector('.action-button:active')) {
    //                 this.classList.add('card-active');
    //             }
    //         }, { passive: true });

    //         card.addEventListener('touchend', function () {
    //             this.classList.remove('card-active');
    //         }, { passive: true });
    //     }
    // });

    // Prevent zoom on double tap for iOS
    document.addEventListener('touchend', function (event) {
        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 300;

        if (this.lastTouchEndTime && now - this.lastTouchEndTime < DOUBLE_TAP_THRESHOLD) {
            event.preventDefault();
        }

        this.lastTouchEndTime = now;
    }, { passive: false });
});