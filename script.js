document.addEventListener("DOMContentLoaded", function () {
    // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // if (isMobile) {
    //     document.querySelector(".facebook").addEventListener("click", function() {
    //         window.open("fb://page/110600357296339", "_blank");
    //     });
    // }
    // else {
    //         document.querySelector(".facebook").addEventListener("click", function() {
    // window.open("https://facebook.com", "_blank");
    // });
    // }

    
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

    // Tiktok Authentication class
    const tiktokAuthentication = new Authentication({
        client_key: 'sbawgv8e7j4nbi22wy',
        client_secret: 'a9UD0KvMZd3XZHie9K6zLYNvndnFDhNf'
    });

    // Must match the URI registered in Sandbox/Production
    const redirectUri = 'https://monaruku.github.io/tiktok_post_vid.html';

    const tiktokScopes = [
        'user.info.basic',
        'video.upload',
        'video.publish'
    ];

    // Get TikTok login URL
    const tiktokAuthenticationUrl = tiktokAuthentication.getAuthenticationUrl(redirectUri, tiktokScopes);

    //Share Stuff
    //Define Image Link
    const imageURL = 'https://static.wixstatic.com/media/a4bb8c_3c067dae40a8430387b5b3fe904c9a62~mv2.png'

    //Define Share text
    const shareText = 'I have a good time here, thank you so much SQL! #SQLEStream'

    async function fetchImageAsFile(url, fileName) {
      try {
        const proxyUrl = "https://corsproxy.io/?url="; // Free CORS proxy
        const response = await fetch(proxyUrl + encodeURIComponent(url));
        const blob = await response.blob();
        return new File([blob], fileName, { type: blob.type });
      } catch (error) {
        console.error("Error fetching image:", error);
        return null;
      }
    }

    async function shareImages() {
      // URLs of the images to fetch
      const imageUrls = [
        "https://cdn.sql.com.my/wp-content/uploads/2024/03/lhdn-e-invoice-seminar.jpg",
        "https://cdn.sql.com.my/wp-content/uploads/2024/02/E-Invoice-Webinar-Poster-scaled.jpg"
      ];

      // Fetch images and convert to File objects
      const filePromises = imageUrls.map((url, index) =>
        fetchImageAsFile(url, `image${index + 1}.jpg`)
      );

      const files = (await Promise.all(filePromises)).filter(Boolean); // Remove null values if fetch fails

      // Check if multiple file sharing is supported
      if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
        try {
          await navigator.share({
            title: "Check out these images!",
            text: "Here are some photos to check out.",
            files
          });
          console.log("Shared successfully!");
        } catch (error) {
          console.error("Sharing failed", error);
        }
      } else {
        console.log("Your browser does not support sharing multiple files or image fetch failed.");
      }
    }



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

    /**
    function copyText() {
        const text = "This place is good and helpful. Accounting made easy!";
        navigator.clipboard.writeText(text);
    }
    */
    var line = [];

    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/TestLine.txt") // Replace with actual file path
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 10) {
                document.getElementById('output').textContent = "File has fewer than 10 lines.";
                return;
            }
            line = lines;
        })
        .catch(error => console.error("Error fetching the file:", error));

    function getLines() {
            const randomLines = [];
            const usedIndexes = new Set();

            while (randomLines.length < 1) {
                const randomIndex = Math.floor(Math.random() * line.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(line[randomIndex]);
                }
            }

            //document.getElementById('output').textContent = "Randomly Selected Lines:\n" + randomLines.join('\n');
            const textTC = randomLines.toString();
            console.log(textTC);
            window.focus();
            navigator.clipboard.writeText(textTC);
            alert("Text copied! Paste it onto Google Review.");
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
                if(links[platform] == 'Red note'){
                    
                    //Check if the device have Rednote installed or not before redirecting
                    var fallbackToStore = function() {
                      window.location = 'https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605';
                    };
                    var openApp = function() {
                      window.location = 'xhsdiscover://user/60ba509f0000000001008605';
                    };

                    openApp();
                    setTimeout(fallbackToStore, 700);
                    
                    //shareToRedNote();
                }
                //lazy way of doing this
                else if(links[platform] == links['Google review']) {
                    //Had to hardcode https link to read text file, or else chrome's security policy will block it
                    getLines()
                    window.open(links['Google review'], '_blank');
                }
                else if(links[platform] == links['Facebook']) {
                    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

                        if (/android/i.test(userAgent)) {
                            window.open(links['Facebook'], '_blank');
                        }

                        // iOS detection from: http://stackoverflow.com/a/9039885/177710
                        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                            //Check if the device have Rednote installed or not before redirecting
                            var fallbackToStore = function() {
                              window.location = links['Facebook'];
                            };
                            var openApp = function() {
                              window.location = links['FacebookIOS'];
                            };

                            openApp();
                            setTimeout(fallbackToStore, 1700);


                            //window.open(links['FacebookIOS'], '_blank');
                        }
                }
                else if (links[platform] == links['TikTok']) {
                    if (tiktokAuthentication.checkTikTokToken()) {
                        window.location.href = "tiktok_post_vid.html";
                    } else {
                        window.location = tiktokAuthenticationUrl;
                    }
                }
                //how many else if do I need
                else if(links[platform] == links['Share']) {
                    //Copy Share Text
                    getLines();
                    shareImages();
                }
                else{
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