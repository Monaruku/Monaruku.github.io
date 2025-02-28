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
        'Instagram': 'https://www.instagram.com/sqlestream/?hl=ms',
        'Google review': 'https://search.google.com/local/writereview?placeid=ChIJd904jxpTzDER2KhXom8b_zI',
        'Red note': 'Red note'
    };

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
        navigator.clipboard.writeText(text).then(() => {
            alert("Text copied! Paste it onto Google Review.");
            window.open(links['Google review'], '_blank');
        }).catch(err => console.error("Failed to copy:", err));
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
                      //window.location = 'https://www.xiaohongshu.com/user/profile/60ba509f0000000001008605';
                    };
                    var openApp = function() {
                      //window.location = 'xhsdiscover://user/60ba509f0000000001008605';
                      window.location = 'xhsdiscover://post';
                    };

                    openApp();
                    setTimeout(fallbackToStore, 700);
                    
                    //shareToRedNote();
                }
                //lazy way of doing this
                else if(links[platform] == links['Google review']) {
                    copyText();
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