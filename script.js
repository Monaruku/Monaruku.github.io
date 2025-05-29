document.addEventListener("DOMContentLoaded", function () {

    const text_lang = {
        'rednote_en': "RedNote",
        'rednote_cn': "小红书",

        'fb_en': "Facebook",
        'fb_cn': "脸书",

        'insta_en': "Instagram",
        'insta_cn': "Instagram",

        'others_en': "Share to Facebook",
        'others_cn': "分享给你的朋友",

        'others_insta_en': "Share to Instagram",
        'others_insta_cn': "分享给你的朋友",

        'others_xhs_en': "Share to RedNote",
        'others_xhs_cn': "分享至小红书",

        'lang_desc_en': "切换语言至...",
        'lang_desc_cn': "Change language to...",

        'lang_en': "中文",
        'lang_cn': "English",

        'cta_en': 'Share now!',
        'cta_cn': '马上分享吧!',
    }

    // let isIOS = false;
    // //Due to a bug, Share to Others button will temporarily be disable on the iOS side
    // if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    //     const othersDiv = document.getElementById('others_xhs');

    //     othersDiv.style.display = "none";
    //     isIOS = true;
    // }



    let isEnglish = true;

    function load_lang() {
        var currentLang = (isEnglish) ? "_en" : "_cn";
        //const media_list = ['tiktok', 'rednote', 'google', 'fb', 'insta', 'others', 'store', 'others_fixed'];
        const media_list = ['rednote', 'fb', 'insta', 'others', 'others_insta'];
        media_list.forEach(media => {
            document.getElementById(media).querySelector('h3').textContent = text_lang[media + currentLang];
        });
        document.querySelector('.footer').querySelector('.prompt').textContent = text_lang['lang_desc' + currentLang];
        document.getElementById('lang').querySelector('h3').textContent = text_lang['lang' + currentLang];
        document.querySelector('.footer').querySelector('.cta').textContent = text_lang['cta' + currentLang];
    };

    window.onload = (event) => {
        load_lang();
    };

    document.getElementById('lang').querySelector('img').addEventListener('click', function (e) {
        isEnglish = !isEnglish;
        load_lang();
    });

    // Define the links
    /*
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
    };*/

    const links = {
        'fb': 'https://www.facebook.com/SQLEstream/',
        'insta': 'https://www.instagram.com/sqlestream/?hl=ms',
        'google': 'https://search.google.com/local/writereview?placeid=ChIJd904jxpTzDER2KhXom8b_zI',
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

    //Loading Screen Stuff-------------------------------------------
    function hideLoadingScreen() {
        const loader = document.getElementById("loading-screen");
        const main = document.getElementById("main-content");

        loader.style.display = "none";
        main.style.display = "block";
    }
    //----------------------------------------------------------------


    //Download image from url thru CORS proxy
    async function fetchImageAsFile(url, fileName) {
        try {
            const proxyUrl = "https://corsproxy.io/?url="; // Free CORS proxy
            const response = await fetch(proxyUrl + encodeURIComponent(url));
            //const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], fileName, { type: blob.type });
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    }

    //Download video from url thru CORS proxy
    async function fetchVideoAsFile(url, fileName) {
        try {
            console.log("Attempting to fetch video directly:", url);

            // For GitHub raw content, we can often access it directly from GitHub Pages
            if (url.includes('githubusercontent.com')) {
                try {
                    // Try direct fetch first - this should work from GitHub Pages to githubusercontent
                    const response = await fetch(url, {
                        headers: { 'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8' },
                        cache: 'no-store'  // Prevent caching issues
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        if (blob.size > 1000) {
                            console.log(`Successfully fetched video directly: ${fileName}, Size: ${blob.size} bytes`);
                            return new File([blob], fileName, { type: blob.type || "video/mp4" });
                        } else {
                            throw new Error("Video file too small, likely invalid");
                        }
                    } else {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                } catch (directError) {
                    console.warn("Direct GitHub fetch failed:", directError);
                    // Fall through to the fallback
                }
            }

            // If we're here, the direct fetch failed
            // Try an alternative approach with simpler URL
            // Sometimes removing some parameters helps
            try {
                const simplifiedUrl = url.split('?')[0]; // Remove query parameters
                console.log("Trying simplified URL:", simplifiedUrl);

                const response = await fetch(simplifiedUrl, {
                    headers: { 'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8' },
                    cache: 'no-store'
                });

                if (response.ok) {
                    const blob = await response.blob();
                    if (blob.size > 1000) {
                        console.log(`Successfully fetched video with simplified URL: ${fileName}, Size: ${blob.size} bytes`);
                        return new File([blob], fileName, { type: blob.type || "video/mp4" });
                    }
                }
            } catch (simplifiedError) {
                console.warn("Simplified URL fetch failed:", simplifiedError);
            }

            // Last resort: Use the embedded placeholder video
            throw new Error("All direct fetch attempts failed");

        } catch (error) {
            console.error("Error fetching video:", error);

            // Return a minimal placeholder video as fallback
            console.log("Using placeholder video as fallback");
            // Small valid MP4 video placeholder
            const placeholderVideoBase64 = "AAAAHGZ0eXBtcDQyAAAAAG1wNDJtcDQxaXNvbWlzbwAAAAhmcmVlAAAAG21kYXQAAAATABVLBgEG79Px5AAAAAAAAAAAAAAA";
            const binaryString = atob(placeholderVideoBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new File([bytes], fileName, { type: "video/mp4" });
        }
    }

    var imageUrls;
    const imageAmt = 3;
    var savedImageFiles = [];

    var videoUrls;
    const videoAmt = 1;
    var savedVideoFiles = [];

    var combinedMediaFiles = [];
    var imagesLoaded = false;
    var videosLoaded = false;

    // Improved function to handle image loading with proper Promise resolution
    async function loadRandomImages() {
        try {
            if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
                console.warn("No image URLs available yet, delaying image loading");
                return [];
            }

            // Shuffle and select
            const shuffledUrls = [...imageUrls].sort(() => 0.5 - Math.random());
            const selectedUrls = shuffledUrls.slice(0, imageAmt);
            console.log("Selected image URLs:", selectedUrls);

            // Fetch and convert
            const filePromises = selectedUrls.map((url, index) =>
                fetchImageAsFile(url, `image${index + 1}.jpg`)
            );
            const files = (await Promise.all(filePromises)).filter(Boolean);

            // Save to array
            savedImageFiles = files;
            console.log("Images loaded successfully:", files.length);

            imagesLoaded = true;
            updateCombinedMedia();
            hideLoadingScreen();
            return files;
        } catch (error) {
            console.error("Error in loadRandomImages:", error);
            imagesLoaded = true;
            updateCombinedMedia();
            hideLoadingScreen();
            return [];
        }
    }

    // Improved function to handle video loading with proper Promise resolution
    async function loadRandomVideos() {
        try {
            if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
                console.warn("No video URLs available yet, delaying video loading");
                return [];
            }

            // Just use the first video URL
            const videoUrl = videoUrls[0];
            console.log("Using video URL:", videoUrl);

            // Fetch and convert
            const videoFile = await fetchVideoAsFile(videoUrl, "video1.mp4");
            // **Log video file details for debugging**
            if (videoFile) {
                console.log("Video file details:", {
                    name: videoFile.name,
                    type: videoFile.type,
                    size: videoFile.size + " bytes"
                });
            }
            // Save to array (only if the fetch was successful)
            if (videoFile) {
                savedVideoFiles = [videoFile];
                console.log("Video loaded successfully:", videoFile.size, "bytes");
            } else {
                console.error("Failed to load video");
                savedVideoFiles = [];
            }

            videosLoaded = true;
            updateCombinedMedia();
            hideLoadingScreen();
            return savedVideoFiles;
        } catch (error) {
            console.error("Error in loadRandomVideos:", error);
            videosLoaded = true;
            updateCombinedMedia();
            hideLoadingScreen();
            return [];
        }
    }

    // Update combined media when both images and videos are loaded
    function updateCombinedMedia() {
        if (imagesLoaded && videosLoaded) {
            try {
                // Reset combined media files
                combinedMediaFiles = [];

                // Add videos first if they exist
                if (savedVideoFiles && savedVideoFiles.length > 0) {
                    const validVideos = savedVideoFiles.filter(file => file && file instanceof File && file.size > 0);
                    if (validVideos.length > 0) {
                        console.log("Adding videos to combined media:", validVideos.length);
                        combinedMediaFiles.push(...validVideos);
                    }
                }

                // Add images if they exist
                if (savedImageFiles && savedImageFiles.length > 0) {
                    const validImages = savedImageFiles.filter(file => file && file instanceof File && file.size > 0);
                    if (validImages.length > 0) {
                        console.log("Adding images to combined media:", validImages.length);
                        combinedMediaFiles.push(...validImages);
                    }
                }

                console.log("Combined media files updated:", combinedMediaFiles.length, "files");
            } catch (error) {
                console.error("Error combining media files:", error);
                combinedMediaFiles = [];
            }
        }
    }

    // Preload ImageURLs from text file with better error handling
    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/ImageLinks.txt")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) {
                throw new Error("No image URLs found in the file");
            }
            imageUrls = lines;
            console.log("Image URLs loaded:", imageUrls.length);
            return loadRandomImages();
        })
        .catch(error => {
            console.error("Error fetching image links:", error);
            imageUrls = [];
            imagesLoaded = true;
            updateCombinedMedia();
        });

    //Preload VideoURLs from text file with better error handling
    fetch("https://raw.githubusercontent.com/AppleCakes14/SQL-Link-Tree/refs/heads/main/VideoLink.txt")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) {
                throw new Error("No video URLs found in the file");
            }
            videoUrls = lines;
            console.log("Video URLs loaded:", videoUrls.length);
            return loadRandomVideos();
        })
        .catch(error => {
            console.error("Error fetching video links:", error);
            videoUrls = []; ``
            videosLoaded = true;
            updateCombinedMedia();
        });


    var savedImageFilesWA;
    var savedVideoFilesWA;
    var combinedMediaFilesWA = [];

    async function loadRandomImagesWA() {
        // Shuffle and select
        const selectedUrls = "https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/Image/Event%20Photos/2025-LHDN-E-Invoice-Seminar-Poster.jpg";
        console.log("Selected URLs:", selectedUrls);

        // Fetch and convert
        const files = await fetchImageAsFile(selectedUrls, "image1.jpg");
        //const files = (await Promise.all(filePromises)).filter(Boolean);

        // Save to array
        savedImageFilesWA = files;
        //hideLoadingScreen();
        console.log(savedImageFilesWA);
    }

    async function loadRandomVideosWA() {
        // Use a specific video URL
        const selectedUrl = "https://raw.githubusercontent.com/AppleCakes14/SQL-Link-Tree/main/Videos/final-1747902221090.mp4";
        console.log("Selected Video URL:", selectedUrl);

        // Fetch and convert
        const file = await fetchVideoAsFile(selectedUrl, "video1.mp4");

        // Save to variable
        savedVideoFilesWA = file;
        console.log("Video loaded:", savedVideoFilesWA);
    }

    // Run both functions and combine results when done
    Promise.all([loadRandomImagesWA(), loadRandomVideosWA()])
        .then(() => {
            // Create combined media files with video first, then image
            combinedMediaFilesWA = [];

            // Add video first if it exists
            if (savedVideoFilesWA) {
                combinedMediaFilesWA.push(savedVideoFilesWA);
            }

            // Add image if it exists
            if (savedImageFilesWA) {
                combinedMediaFilesWA.push(savedImageFilesWA);
            }

            console.log("Combined media files(WA):", combinedMediaFilesWA);
        })
        .catch(error => {
            console.error("Error loading media files:", error);
        });




    //The actual share Image function, basically retrieve saved images and send them to share
    async function shareImages(mode) {

        //     // Shuffle and pick imageAmt of random images
        //     const shuffledUrls = imageUrls.sort(() => 0.5 - Math.random());
        //     const selectedUrls = shuffledUrls.slice(0, imageAmt);
        //     console.log(selectedUrls);


        //   // Fetch images and convert to File objects
        //   const filePromises = selectedUrls.map((url, index) =>
        //     fetchImageAsFile(url, `image${index + 1}.jpg`)
        //   );


        if (mode == 1)            //Normal Mode
        {
            // const files; // Assign the images to be shared
            // if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {

            // } else {
            // console.log("Your browser does not support sharing multiple files or image fetch failed.");
            // }

            const dummyJpgDataUrl =
                'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTERUTEhMWFhUXFxgYFxcYGBgYGBcXGBgXFxgYGBgYHSggGBolHRgXITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGhAQGy0lICUvLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAJABWgMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAFAQIDBAYAB//EAD0QAAIBAgMFBQYFAwMFAAAAAAABAgMRBBIhMQVBUWFxgZGh8BMikQcjQlJicoKx0eHwM2LhFjNTc5Ik/8QAGgEAAgMBAQAAAAAAAAAAAAAAAAQCAwUBBv/EACIRAQEAAgEEAgMAAAAAAAAAAAABAhEDITESQVFhEzKhcf/aAAwDAQACEAMQAAAB4ltRFOu7XGLXHaHzAWxBaAa2bUkGHnEfqNPAm6AW8YOYPvN+HezRBSfWmXgACQpbnJj9TlnxWc9qAiVZKucYiPMlnLHYU3mgWEsS05klgz7kQ4iCDKCyxDNi/PSYhtqS92REnAhHnDdtNv0IMinV7hMKYW9EsGyglLqAlPGdlQ1WxRJrKM2tHIt1Si0KQUJYIQ3K7ZAtGmPGWNv8kIG4eI5XiGZJ6m9hvKeZro0WaQ7lFRUXZBVuQ4v/2Q==';

            function dataUrlToFile(dataUrl, filename) {
                const arr = dataUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                const n = bstr.length;
                const u8arr = new Uint8Array(n);
                for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
                return new File([u8arr], filename, { type: mime });
            }

            // Usage
            const dummy = dataUrlToFile(dummyJpgDataUrl, 'dummy.jpg');

            //const dummy = new File([""], "empty.txt", { type: "text/plain" });
            try {
                await navigator.share({
                    text: getLines(2),
                    files: [savedImageFilesWA, dummy]
                    //url: "https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/Image/Event%20Photos/2025-LHDN-E-Invoice-Seminar-Poster.jpg"
                });
                //console.log("Shared successfully!");
            } catch (error) {
                console.error("Sharing failed", error);
            }
        }
        else if (mode == 2) {
            // Use the same approach as image sharing
            // Fetch the video file using the same CORS proxy method
            try {
                // Check if we have preloaded videos
                if (!savedVideoFiles || savedVideoFiles.length === 0 || !savedVideoFiles[0]) {
                    console.error("No preloaded video files available");
                    alert("No videos available to share. Please try again later.");
                    return;
                }

                const videoFile = savedVideoFiles[0];
                console.log("Using preloaded video:", videoFile.name, videoFile.size, "bytes");

                // Create a combined array with the preloaded video and images
                const combinedFiles = [];

                // Add the video first
                combinedFiles.push(videoFile);

                // Add the preloaded images if available
                if (savedImageFiles && savedImageFiles.length > 0) {
                    const validImages = savedImageFiles.filter(Boolean);
                    console.log("Adding preloaded images to share:", validImages.length, "images");
                    combinedFiles.push(...validImages);
                }

                // Create and show a confirmation dialog
                const confirmDialog = document.createElement('div');
                confirmDialog.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center;';

                const dialogContent = document.createElement('div');
                dialogContent.style.cssText = 'background:white; padding:20px; border-radius:10px; max-width:80%; text-align:center;';
                dialogContent.innerHTML = `
                    <h3>Share Video</h3>
                    <p>Ready to share: ${videoFile.name}</p>
                    <button id="confirmShare" style="background:#4CAF50; color:white; border:none; padding:10px 20px; margin:10px; border-radius:5px; cursor:pointer;">Share Now</button>
                    <button id="cancelShare" style="background:#f44336; color:white; border:none; padding:10px 20px; margin:10px; border-radius:5px; cursor:pointer;">Cancel</button>
                `;

                confirmDialog.appendChild(dialogContent);
                document.body.appendChild(confirmDialog);

                // Add event listeners to the buttons
                document.getElementById('confirmShare').addEventListener('click', async () => {
                    // Remove the dialog
                    document.body.removeChild(confirmDialog);

                    // This click event is a direct user gesture, so share should work
                    if (navigator.canShare && navigator.canShare({ files: combinedFiles })) {
                        try {
                            console.log("Attempting to share files:", combinedFiles.length);

                            // Log file sizes to debug
                            combinedFiles.forEach((file, index) => {
                                console.log(`File ${index}: ${file.name}, ${file.size} bytes, type: ${file.type}`);
                            });

                            // Ensure files are valid
                            const validFiles = combinedFiles.filter(file =>
                                file && file instanceof File && file.size > 0
                            );

                            if (validFiles.length === 0) {
                                throw new Error("No valid files to share");
                            }

                            await navigator.share({
                                text: getLines(2),
                                files: validFiles
                            });
                            console.log("Media shared successfully!");

                        } catch (shareError) {
                            console.error("Sharing failed:", shareError);
                            alert("Unable to share media. Please try again later.");
                        }
                    } else {
                        console.log("Your browser does not support sharing these files.");
                        alert("Your browser doesn't support sharing these files.");
                    }
                });

                document.getElementById('cancelShare').addEventListener('click', () => {
                    document.body.removeChild(confirmDialog);
                });

            } catch (error) {
                console.error("Error in video sharing process:", error);
            }
        }

        else if (mode == 3) {
            try {
                await navigator.share({
                    text: getLines(2),
                    files: [savedImageFilesWA]
                    //url: "https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/Image/Event%20Photos/2025-LHDN-E-Invoice-Seminar-Poster.jpg"
                });
                //console.log("Shared successfully!");
            } catch (error) {
                console.error("Sharing failed", error);
            }
        }
        if (mode == 4) {
            // Mode 4: Share to Facebook with both images and videos
            console.log("Sharing to Facebook mode activated");

            try {
                // // Create array with both video and images
                // const filesToShare = [];

                // // Add video if available (using savedVideoFilesWA)
                // if (savedVideoFilesWA) {
                //     console.log("Adding video to Facebook share:", savedVideoFilesWA.name);
                //     filesToShare.push(savedVideoFilesWA);
                // }

                // // Add images
                // if (savedImageFiles && savedImageFiles.length > 0) {
                //     console.log("Adding images to Facebook share:", savedImageFiles.length, "images");
                //     filesToShare.push(...savedImageFiles.filter(Boolean));
                // } else if (savedImageFilesWA) {
                //     // Fallback to WA image if regular images aren't available
                //     filesToShare.push(savedImageFilesWA);
                // }

                // Share content
                console.log("Combined media files for Facebook share:", combinedMediaFiles);
                await navigator.share({
                    text: getLines(2),
                    files: combinedMediaFiles
                });

                console.log("Facebook share successful!");
            } catch (error) {
                console.error("Facebook sharing failed", error);
            }
        }
    }


    /*------------- This section is currently under testing, so it looks real stupid -------------*/
    const flag = "#English"; // Change this to the desired flag
    const flagCN = "#Chinese";
    let imageUrlsEN = [];
    let imageUrlsCN = [];

    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/ImageLinksFlagged.txt")
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            let capture = false;

            for (let i = 0; i < lines.length; i++) {
                const trimmed = lines[i].trim();
                if (trimmed.startsWith("#")) {
                    capture = trimmed === flag; // Start capturing if it matches the flag
                    continue;
                }
                if (capture && trimmed !== "") {
                    imageUrlsEN.push(trimmed); // Collect all URLs under the flag
                }
                if (capture && (i + 1 < lines.length && lines[i + 1].startsWith("#"))) {
                    break; // Stop capturing when the next flag appears
                }
            }

            //console.log(imageUrlsEN); // Output filtered URLs
        })
        .catch(error => console.error("Error fetching the file:", error));

    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/ImageLinksFlagged.txt")
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            let capture = false;

            for (let i = 0; i < lines.length; i++) {
                const trimmed = lines[i].trim();
                if (trimmed.startsWith("#")) {
                    capture = trimmed === flagCN; // Start capturing if it matches the flag
                    continue;
                }
                if (capture && trimmed !== "") {
                    imageUrlsCN.push(trimmed); // Collect all URLs under the flag
                }
                if (capture && (i + 1 < lines.length && lines[i + 1].startsWith("#"))) {
                    break; // Stop capturing when the next flag appears
                }
            }

            //console.log(imageUrlsCN); // Output filtered URLs
        })
        .catch(error => console.error("Error fetching the file:", error));

    // async function shareAlternative(mode) {
    //     // Shuffle and pick imageAmt of random images
    //     const shuffledUrls = imageUrls.sort(() => 0.5 - Math.random());
    //     var selectedUrls = shuffledUrls.slice(0, imageAmt);
    //     if(isEnglish){
    //         let number = Math.min(selectedUrls.length, imageUrlsEN.length);
    //         for (let i = 0; i < number; i++) {
    //             selectedUrls[i] = imageUrlsEN[i];
    //         }
    //     }
    //     else {
    //         let number = Math.min(selectedUrls.length, imageUrlsCN.length);
    //         for (let i = 0; i < number; i++) {
    //             selectedUrls[i] = imageUrlsCN[i];
    //         }
    //     }
    //     selectedUrls = selectedUrls.sort(() => 0.5 - Math.random());
    //     //console.log(selectedUrls);


    //   // Fetch images and convert to File objects
    //   const filePromises = selectedUrls.map((url, index) =>
    //     fetchImageAsFile(url, `image${index + 1}.jpg`)
    //   );

    //   const files = (await Promise.all(filePromises)).filter(Boolean); // Remove null values if fetch fails

    //   if (mode == 0){
    //           // Check if multiple file sharing is supported
    //   if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
    //     try {
    //       await navigator.share({
    //         text: getLines(2),
    //         files
    //       });
    //       //console.log("Shared successfully!");
    //     } catch (error) {
    //       //console.error("Sharing failed", error);
    //     }
    //   } else {
    //     //console.log("Your browser does not support sharing multiple files or image fetch failed.");
    //   }
    //   }
    //   else if (mode == 1) {
    //           // Check if multiple file sharing is supported
    //   if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
    //     try {
    //       await navigator.share({
    //         text: getLinesXHS(2),
    //         files
    //       });
    //       //console.log("Shared successfully!");
    //     } catch (error) {
    //       //console.error("Sharing failed", error);
    //     }
    //   } else {
    //     //console.log("Your browser does not support sharing multiple files or image fetch failed.");
    //   }
    //   }
    // }

    //document.getElementById("shareAlt").addEventListener("click", shareAlternative);

    /*--------------------------------------------------------------------------------------------*/


    //Preloaded content
    //var line;
    var lineCN;

    /** <--- Preload Content ---> **/
    //Had to hardlink the text file now because of CORS security policy
    //fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineEnglish.txt") // Replace with actual file path
    //    .then(response => response.text())
    //    .then(text => {
    //        const lines = text.split('\n').filter(line => line.trim() !== '');
    //        line = lines;
    //    })
    //.catch(error => console.error("Error fetching the file:", error));

    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineChinese.txt") // Replace with actual file path
        .then(response => response.text())
        .then(text => {
            const linesCN = text.split('@').map(part => part.trim());
            lineCN = linesCN;
            //console.log(lineCN);


        })
        .catch(error => console.error("Error fetching the file:", error));

    //var lineXHS;
    var lineCNXHS;

    /** <--- Preload Content ---> **/
    //Had to hardlink the text file now because of CORS security policy
    //fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineEnglish_XHS.txt") // Replace with actual file path
    //    .then(response => response.text())
    //    .then(text => {
    //const linesXHS = text.split('\n').filter(line => line.trim() !== '');
    //        lineXHS = text;
    //    })
    //.catch(error => console.error("Error fetching the file:", error));

    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/LineChinese_XHS.txt")
        .then(response => response.text())
        .then(text => {
            // Split the text using '@' as the delimiter
            const lineCNXHS1 = text.split('@').map(part => part.trim());
            lineCNXHS = lineCNXHS1;
            //console.log(lineCNXHS);
        })
        .catch(error => console.error("Error fetching the file:", error));


    /* <-------------------> */

    //Click Analytics
    function logClick(mode) {
        const formUrl = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdZy1xdTPov0ANI9atEkf9Vp9e36V1lvOKFspzHqUYmxXQNvQ/formResponse";
        const formData = new FormData();

        // Replace this with the name attribute of your form field
        if (mode == 1) {                                         //Facebook
            formData.append("entry.2141122930", "Facebook");
        }
        else if (mode == 2) {                                   //Rednote
            formData.append("entry.2141122930", "Rednote");
        }
        else if (mode == 3) {                                   //Instagram
            formData.append("entry.2141122930", "Instagram");
        }
        else if (mode == 4) {                                   //Share
            formData.append("entry.2141122930", "Share");
        }

        fetch(formUrl, {
            method: "POST",
            mode: "no-cors",
            body: formData
        });
    }




    //Get Random Line from preloaded contents
    function getLines(mode) {
        const randomLines = [];
        const usedIndexes = new Set();

        while (randomLines.length < 1) {
            if (isEnglish) {
                const randomIndex = Math.floor(Math.random() * lineCN.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(lineCN[randomIndex]);      //Only received chinese text
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

        //document.getElementById('output').textContent = "Randomly Selected Lines:\n" + randomLines.join('\n');
        //Basically now the two mode is just to prompt alert or not
        if (mode == 1) {
            const textTC = randomLines.toString();
            //console.log(textTC);
            window.focus();
            navigator.clipboard.writeText(textTC);
            alert(isEnglish ? "Text copied! Paste it onto Google Review." : "复制成功！请粘贴在下一页的谷歌评论。");
        }
        else if (mode == 2) {
            const textTC = randomLines.toString();
            //console.log(textTC);
            window.focus();
            navigator.clipboard.writeText(textTC);
            return textTC;
        }

    }

    //Get Random Line from preloaded contents for XHS Special
    function getLinesXHS(mode) {
        const randomLines = [];
        const usedIndexes = new Set();

        while (randomLines.length < 1) {
            if (isEnglish) {
                const randomIndex = Math.floor(Math.random() * lineCNXHS.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(lineCNXHS[randomIndex]);      //Only received chinese text
                }
            }
            else {
                const randomIndex = Math.floor(Math.random() * lineCNXHS.length);
                if (!usedIndexes.has(randomIndex)) {
                    usedIndexes.add(randomIndex);
                    randomLines.push(lineCNXHS[randomIndex]);
                }
            }

        }

        //document.getElementById('output').textContent = "Randomly Selected Lines:\n" + randomLines.join('\n');
        //Basically now the two mode is just to prompt alert or not
        // if (mode == 1) {
        //     const textTC = randomLines.toString();
        //     //console.log(textTC);
        //     window.focus();
        //     navigator.clipboard.writeText(textTC);
        //     alert(isEnglish ? "Text copied! Paste it onto Google Review." : "复制成功！请粘贴在下一页的谷歌评论。");
        // }
        // else if (mode == 2) {
        //     const textTC = randomLines.toString();
        //     //console.log(textTC);
        //     window.focus();
        //     navigator.clipboard.writeText(textTC);
        //     return textTC;
        // }
        const textTC = randomLines.toString();
        if (mode == 1) {
            try {
                window.focus(); // Try to focus the window
                navigator.clipboard.writeText(textTC)
                    .then(() => {
                        alert(isEnglish ? "Text copied! Paste it onto XHS." : "复制成功！请粘贴在小红书。");
                    })
                    .catch(err => {
                        console.error("Clipboard write failed:", err);
                        // Fallback - show text to manually copy
                        prompt(isEnglish ? "Please copy this text manually:" : "请手动复制此文本:", textTC);
                    });
            } catch (error) {
                console.error("Clipboard error:", error);
                // Fallback - show text to manually copy
                prompt(isEnglish ? "Please copy this text manually:" : "请手动复制此文本:", textTC);
            }
        } else if (mode == 2) {
            return textTC; // Just return the text without clipboard operations
        }
    }

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', async function (e) {
            const platform = this.id;
            /*if (platform == 'others_fixed') {
    shareAlternative();
} else if (platform == 'lang') {
    // Do nothing - this is language switcher
} else {
    //Check if can use web share API level 2
    if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
        //Copy Share Text
        getLines();
        shareImages();
        return true;
    } else {
        alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
        return false;
    }
}
    */
            if (platform == 'rednote') {

                //Check if the device have Rednote installed or not before redirecting
                logClick(2);
                var fallbackToStore = function () {
                    window.open('https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605', '_blank');
                };
                var openApp = function () {
                    window.location = 'xhsdiscover://user/60ba509f0000000001008605';
                };

                openApp();
                setTimeout(fallbackToStore, 1500);

                //shareToRedNote();
            }
            //how many else if do I need
            else if (platform == 'others') {             //Currently in whatsapp mode
                //Check if can use web share API level 2
                if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                    //Copy Share Text
                    //var line = getLines(2);
                    logClick(4);
                    shareImages(2);
                    return true;
                } else {
                    alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
                    return false;
                }
            }
            else if (platform == 'others_insta') {
                //Check if can use web share API level 2
                // if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                //Copy Share Text
                //var line = getLines(2);
                logClick(4);
                try {
                    // Get the share text first
                    const shareText = getLines(2);

                    // Try Web Share API first for video
                    if (savedVideoFiles && savedVideoFiles.length > 0 &&
                        savedVideoFiles[0] && savedVideoFiles[0].size > 0) {

                        const videoFile = savedVideoFiles[0];
                        console.log("Attempting to share video:", videoFile.name, videoFile.size);

                        if (navigator.canShare && navigator.canShare({ files: [videoFile] })) {
                            try {
                                await navigator.share({
                                    text: shareText,
                                    files: [videoFile]
                                });
                                console.log("Video sharing successful!");
                                return;
                            } catch (shareError) {
                                console.log("Web Share API failed for video:", shareError);
                                // Fall through to alternative method
                            }
                        }

                        // If Web Share API failed, use our alternative download approach
                        shareVideoWithDownloadLink(videoFile, shareText);
                        return;
                    }

                    // Fallback to image if no video
                    if (savedImageFiles && savedImageFiles.length > 0) {
                        const validImage = savedImageFiles.find(file => file && file.size > 0);
                        if (validImage) {
                            try {
                                await navigator.share({
                                    text: shareText,
                                    files: [validImage]
                                });
                                console.log("Image sharing successful!");
                                return;
                            } catch (error) {
                                console.error("Image sharing failed:", error);
                            }
                        }
                    }

                    // Final fallback - just copy text
                    await navigator.clipboard.writeText(shareText);
                    alert("Text copied to clipboard!");

                } catch (error) {
                    console.error("Sharing error:", error);
                    alert("Unable to share. Please try again.");
                }
            }
            else if (platform == 'others_fixed') {
                //shareAlternative(0);
            }
            else if (platform == 'others_xhs') {
                // //Check if can use web share API level 2
                // if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                //     //Copy Share Text
                //     //var line = getLinesXHS(2);
                //     shareImages(2);
                //     return true;
                // } else {
                //     alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
                //     return false;
                // }
                try {
                    const shareText = getLinesXHS(2); // Just get the text without clipboard operations

                    // Try to share with files first
                    if (savedImageFiles && savedImageFiles.length > 0) {
                        const validImage = savedImageFiles.find(file => file && file.size > 0);

                        if (validImage && navigator.canShare && navigator.canShare({ files: [validImage] })) {
                            await navigator.share({
                                text: shareText,
                                files: [validImage]
                            });
                            return true;
                        }
                    }

                    // If sharing with files fails or isn't supported, fall back to text-only
                    await navigator.share({
                        text: shareText
                    });
                    return true;

                } catch (error) {
                    console.error("XHS sharing failed:", error);

                    // Final fallback - try to copy to clipboard with focus attempt
                    try {
                        window.focus();
                        document.hasFocus() ?
                            await navigator.clipboard.writeText(getLinesXHS(2)) :
                            alert("Please focus the window and try again.");
                    } catch (clipboardError) {
                        prompt("Please copy this text manually:", getLinesXHS(2));
                    }
                    return false;
                }
            }
            else if (platform == 'fb') {
                window.open(links[platform], '_blank');
                logClick(1);
            }
            else if (platform == 'insta') {
                window.open(links[platform], '_blank');
                logClick(3);
            }
        });
    });

    /*document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function (e) {
            const platform = this.id;
            else {
                const actionType = this.textContent;
                alert(`You are about to ${actionType.toLowerCase()} on ${platform}!`);
                // Here you would implement the functionality for other platforms
            }
        });
    });
    */

    /*
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
                else if(links[platform] == links['Google review']) {
                    //Had to hardcode https link to read text file, or else chrome's security policy will block it
                    getLines(1)
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
                    if (tiktokAuthentication.checkTikTokToken()) {
                        window.location.href = "tiktok_post_vid.html";
                    } else {
                        window.location = tiktokAuthenticationUrl;
                    }
                }
                //how many else if do I need
                else if(links[platform] == links['Share']) {
                    //Check if can use web share API level 2
                    if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                    //Copy Share Text
                    getLines();
                    shareImages();
                    return true;
                    } else {
                        alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
                        return false;
                    }
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
    });*/

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