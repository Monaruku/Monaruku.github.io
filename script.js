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

    function load_lang () {
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

    var imageUrls;
    const imageAmt = 3;
    var savedImageFiles = [];

    //Preload ImageURLs from text file
    fetch("https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/ImageLinks.txt") // Replace with actual file path
        .then(response => response.text())
        .then(text => {
            const line = text.split('\n').filter(line => line.trim() !== '');
            imageUrls = line;
            //console.log(imageUrls);
            loadRandomImages()
        })
        .catch(error => console.error("Error fetching the file:", error));

    async function loadRandomImages() {
      // Shuffle and select
      const shuffledUrls = imageUrls.sort(() => 0.5 - Math.random());
      const selectedUrls = shuffledUrls.slice(0, imageAmt);
      //console.log("Selected URLs:", selectedUrls);

      // Fetch and convert
      const filePromises = selectedUrls.map((url, index) =>
          fetchImageAsFile(url, `image${index + 1}.jpg`)
      );
      const files = (await Promise.all(filePromises)).filter(Boolean);

      // Save to array
      savedImageFiles = files;
      hideLoadingScreen();
      console.log(savedImageFiles);
    }

    var savedImageFilesWA;

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

    loadRandomImagesWA();




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
            files : [savedImageFilesWA, dummy]
            //url: "https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/Image/Event%20Photos/2025-LHDN-E-Invoice-Seminar-Poster.jpg"
            });
            //console.log("Shared successfully!");
        } catch (error) {
            console.error("Sharing failed", error);
        }


    }
    else if (mode == 2) {
        const files = savedImageFiles; // Assign the images to be shared
        if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
            try {
                await navigator.share({
                text: getLinesXHS(2),
                files
                });
                //console.log("Shared successfully!");
            } catch (error) {
                //console.error("Sharing failed", error);
            }
            } else {
            //console.log("Your browser does not support sharing multiple files or image fetch failed.");
            }
    }
    else if (mode == 3) {
        try {
            await navigator.share({
            text: getLines(2),
            files : [savedImageFilesWA]
            //url: "https://raw.githubusercontent.com/Monaruku/Monaruku.github.io/refs/heads/main/Image/Event%20Photos/2025-LHDN-E-Invoice-Seminar-Poster.jpg"
            });
            //console.log("Shared successfully!");
        } catch (error) {
            console.error("Sharing failed", error);
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
            const linesCN= text.split('@').map(part => part.trim());
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
        if(mode == 1) {                                         //Facebook
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
                if(isEnglish){
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
            if(mode == 1) {
                const textTC = randomLines.toString();
                //console.log(textTC);
                window.focus();
                navigator.clipboard.writeText(textTC);
                alert(isEnglish ? "Text copied! Paste it onto Google Review." : "复制成功！请粘贴在下一页的谷歌评论。");
            }
            else if(mode == 2) {
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
                if(isEnglish){
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
            if(mode == 1) {
                const textTC = randomLines.toString();
                //console.log(textTC);
                window.focus();
                navigator.clipboard.writeText(textTC);
                alert(isEnglish ? "Text copied! Paste it onto Google Review." : "复制成功！请粘贴在下一页的谷歌评论。");
            }
            else if(mode == 2) {
                const textTC = randomLines.toString();
                //console.log(textTC);
                window.focus();
                navigator.clipboard.writeText(textTC);
                return textTC;
            }

    }

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function (e) {
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
            if(platform == 'rednote'){
                
                //Check if the device have Rednote installed or not before redirecting
                logClick(2);
                var fallbackToStore = function() {
                    window.open('https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605', '_blank');
                };
                var openApp = function() {
                    window.location = 'xhsdiscover://user/60ba509f0000000001008605';
                };

                openApp();
                setTimeout(fallbackToStore, 1500);
                
                //shareToRedNote();
            }
            //how many else if do I need
            else if(platform == 'others') {             //Currently in whatsapp mode
                //Check if can use web share API level 2
                if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                //Copy Share Text
                //var line = getLines(2);
                logClick(4);
                // if(isIOS){
                //     shareImages(2);
                // }
                // else {
                //     shareImages(2);
                // }
                shareImages(2);
                return true;
                } else {
                    alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
                    return false;
                }
            }
            else if(platform == 'others_insta') {           
                //Check if can use web share API level 2
                if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                //Copy Share Text
                //var line = getLines(2);
                logClick(4);
                // if(isIOS){
                //     shareImages(2);
                // }
                // else {
                //     shareImages(2);
                // }
                shareImages(2);
                return true;
                } else {
                    alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
                    return false;
                }
            }
            else if (platform == 'others_fixed') {
                //shareAlternative(0);
            }
            else if (platform == 'others_xhs') {
                //Check if can use web share API level 2
                if (navigator.canShare && navigator.canShare({ files: [new File(["test"], "test.txt", { type: "text/plain" })] })) {
                    //Copy Share Text
                    //var line = getLinesXHS(2);
                    shareImages(2);
                    return true;
                    } else {
                        alert("Web Share API Level 2 is NOT supported. Sharing multiple files may not work.");
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
                else{
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