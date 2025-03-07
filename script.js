document.addEventListener("DOMContentLoaded", function () {
 
    /*----------------------- Change Language Module ------------------------- */

    // Language text holder
    const text_lang = {
        'tiktok_p_en': "Share to",
        'tiktok_p_cn': "分享至",
        'tiktok_h_en': "TikTok",
        'tiktok_h_cn': "TikTok",
        'tiktok_b_en': "Share",
        'tiktok_b_cn': "分享",

        'rednote_p_en': "Follow us on",
        'rednote_p_cn': "关注我们",
        'rednote_h_en': "Red note",
        'rednote_h_cn': "小红书",
        'rednote_b_en': "Follow",
        'rednote_b_cn': "关注",
        
        'google_p_en': "Review us on",
        'google_p_cn': "给个好评",
        'google_h_en': "Google review",
        'google_h_cn': "谷歌评论",
        'google_b_en': "Review",
        'google_b_cn': "评论",

        'fb_p_en': "Follow us on",
        'fb_p_cn': "关注我们",
        'fb_h_en': "Facebook",
        'fb_h_cn': "脸书",
        'fb_b_en': "Share",
        'fb_b_cn': "关注",

        'insta_p_en': "Follow us on",
        'insta_p_cn': "关注我们",
        'insta_h_en': "Instagram",
        'insta_h_cn': "Instagram",
        'insta_b_en': "Follow",
        'insta_b_cn': "关注",

        'others_p_en': "Press to",
        'others_p_cn': "搓下按钮",
        'others_h_en': "Share",
        'others_h_cn': "分享",
        'others_b_en': "Share",
        'others_b_cn': "分享",

        'lang_desc_en': "更改语言至...",
        'lang_desc_cn': "Change language to...",

        'lang_b_en': "中文",
        'lang_b_cn': "English",
    }

    // Language toggle
    let isEnglish = true;

    // Language loader
    function load_lang (){
        var currentLang = (isEnglish) ? "_en" : "_cn";
        const media_list = ['tiktok', 'rednote', 'google', 'fb', 'insta', 'others'];
        const elem_list = ['_p', '_h', '_b'];
        media_list.forEach(media => {
            elem_list.forEach(elem => {
                //console.log(media + elem + currentLang);
                document.getElementById(media + elem).textContent = text_lang[media + elem + currentLang];
            });
        });
        document.getElementById('lang_desc').textContent = text_lang['lang_desc' + currentLang];
        document.getElementById('lang_b').textContent = text_lang['lang_b' + currentLang];
    };

    // Load language once on window load
    window.onload = (event) => {
        load_lang();
    };

    // Load language when change language
    document.getElementById('lang_b').addEventListener('click', function (e) {
        isEnglish = !isEnglish;
        load_lang();
    });

    /*----------------------- End of Change Language Module ------------------------- */

    /*----------------------- Actual Linking Module ------------------------- */
    
    // Define the links
    const links = {
        'Facebook Page': 'https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/SQLEstream/',
        'Facebook': 'https://www.facebook.com/SQLEstream/',
        "脸书": 'https://www.facebook.com/SQLEstream/',
        'FacebookIOS': 'fb://page/110600357296339',
        'Instagram': 'https://www.instagram.com/sqlestream/?hl=ms',
        'Google review': 'https://search.google.com/local/writereview?placeid=ChIJd904jxpTzDER2KhXom8b_zI',
        '谷歌评论': 'https://search.google.com/local/writereview?placeid=ChIJd904jxpTzDER2KhXom8b_zI',
        'Red note': 'Red note',
        '小红书': 'Red note',
        'TikTok': 'TikTok',
        'Share': 'Share',
        '分享': 'Share'
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

    //Download image from url thru CORS proxy
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

    // Preloaded Image URL Holder
    var imageUrls;

    // Preload ImageURLs from text file
    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/ImageLinks.txt") // Replace with actual file path
        .then(response => response.text())
        .then(text => {
            const line = text.split('\n').filter(line => line.trim() !== '');
            imageUrls = line;
            console.log(imageUrls);
        })
        .catch(error => console.error("Error fetching the file:", error));

    // The actual share Image function, basically call download and send them to share
    async function shareImages() {

        // Fetch images and convert to File objects
        const filePromises = imageUrls.map((url, index) =>
            fetchImageAsFile(url, `image${index + 1}.jpg`)
        );

        const files = (await Promise.all(filePromises)).filter(Boolean); // Remove null values if fetch fails

        // Check if multiple file sharing is supported
        if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
            try {
                await navigator.share({
                    text: getLines(2),
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

    // Preloaded Content Holder
    var line;
    var lineCN;

    /* --------------------------- Fetch Preloaded Content --------------------*/
    //Had to hardlink the text file now because of CORS security policy
    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineEnglish.txt") // Replace with actual file path
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            line = lines;
        })
    .catch(error => console.error("Error fetching the file:", error));

    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineChinese.txt") // Replace with actual file path
        .then(response => response.text())
        .then(text => {
            const linesCN = text.split('\n').filter(line => line.trim() !== '');
            lineCN = linesCN;
        })
    .catch(error => console.error("Error fetching the file:", error));

    /* --------------------------- End of Fetch Preloaded Content --------------------*/

    // Get Random Line from preloaded contents
    function getLines(mode) {
        const randomLines = [];
        const usedIndexes = new Set();

        while (randomLines.length < 1) {
            if(isEnglish){
                const randomIndex = Math.floor(Math.random() * line.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(line[randomIndex]);
                }
            }
            else {
                const randomIndex = Math.floor(Math.random() * lineCN.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(lineCN[randomIndex]);
                }
            }
        }

        // Basically now the two mode is just to prompt alert or not
        if(mode == 1) {
            const textTC = randomLines.toString();
            console.log(textTC);
            window.focus();
            navigator.clipboard.writeText(textTC);
            alert(isEnglish ? "Text copied! Paste it onto Google Review." : "复制成功！请粘贴在下一页的谷歌评论。");
        }
        else if(mode == 2) {
            const textTC = randomLines.toString();
            console.log(textTC);
            window.focus();
            navigator.clipboard.writeText(textTC);
            return textTC;
        }
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
                    
                    // Check if the device have Rednote installed or not before redirecting
                    var fallbackToStore = function() {
                      window.location = 'https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605';
                    };
                    var openApp = function() {
                      window.location = 'xhsdiscover://user/60ba509f0000000001008605';
                    };

                    openApp();
                    setTimeout(fallbackToStore, 700);
                }
                // lazy way of doing this
                else if(links[platform] == links['Google review']) {
                    // Had to hardcode https link to read text file, or else chrome's security policy will block it
                    getLines(1)
                    window.open(links['Google review'], '_blank');
                }
                else if(links[platform] == links['Facebook']) {
                    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

                    if (/android/i.test(userAgent)) {
                        window.open(links['Facebook'], '_blank');
                    }

                    // iOS detection from: http://stackoverflow.com/a/9039885/177710
                    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                        // Check if the device have Rednote installed or not before redirecting
                        var fallbackToStore = function() {
                            window.location = links['Facebook'];
                        };
                        var openApp = function() {
                            window.location = links['FacebookIOS'];
                        };

                        openApp();
                        setTimeout(fallbackToStore, 1700);
                    }
                }
                else if (links[platform] == links['TikTok']) {
                    if (tiktokAuthentication.checkTikTokToken()) {
                        window.location.href = "tiktok_post_vid.html";
                    } else {
                        window.location = tiktokAuthenticationUrl;
                    }
                }
                // how many else if do I need
                else if(links[platform] == links['Share']) {

                    // Check if can use web share API level 2
                    if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                    // Copy Share Text
                    getLines();
                    shareImages();
                    return true;
                    } else {
                        alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
                        return false;
                    }
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

    /*----------------------- End of Actual Linking Module ------------------------- */

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