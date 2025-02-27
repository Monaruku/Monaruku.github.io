document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.wifi').forEach(button => {
        button.addEventListener('click', function() {
            alert('This will redirect to the respective page wifi!');
        });
    });

    var facebookLinks = function () {

    var detectOs = {
        getUserAgent: function () {
            return navigator.userAgent;
        },
        getPlatform: function () {
            return navigator.platform;
        },
        isIos: function () {
            return /iPhone|iPad|iPod/.test(detectOs.getPlatform());
        },
        isAndroid: function () {
            return /Android/.test(detectOs.getUserAgent());
        },
        isBlackBerry: function () {
            return /BlackBerry/.test(detectOs.getPlatform());
        },
        isMac: function () {
            return /Mac/.test(detectOs.getPlatform());
        },
        isWindows: function () {
            return /Win/.test(detectOs.getPlatform());
        },
        isLinux: function () {
            return /Linux/.test(detectOs.getPlatform()) && !detectOs.isAndroid();
        },
        get: function () {
            if (detectOs.isIos()) {return 'iOS';}
            if (detectOs.isAndroid()) {return 'Android';}
            if (detectOs.isBlackBerry()) {return 'BlackBerry';}
            if (detectOs.isMac()) {return 'Mac';}
            if (detectOs.isWindows()) {return 'Windows';}
            if (detectOs.isLinux()) {return 'Linux';}
            return 'Unknown';
        }
    };

    var detectFBPageName = {
        getName: function (pageUrl) {
            try {
							  if(!pageUrl.includes('facebook.com')){
									return false;
								}
                var url = new URL(pageUrl);
								var urlParts = url.pathname.split('/');
							
								var name = urlParts.pop();
								if(name){
									return name;
								} else {
									return urlParts.pop();
								}
                
            } catch (ex) {
                return false;
            }
            return false;
        }
    };

	if (detectOs.isAndroid() || detectOs.isIos() ) {
		jQuery('a').each(function () {

			var pageID = '110600357296339';

			if (!pageID) {
				return;
			}
			
			var currentUrl = jQuery(this).attr('href');
			
			if (detectOs.isAndroid()) {
				jQuery(this).attr('href', 'intent://page/' + pageID + '#Intent;scheme=fb;package=com.facebook.katana;S.browser_fallback_url='+ encodeURIComponent(currentUrl) +';end');
			} else if (detectOs.isIos()) {
				jQuery(this).attr('href', 'fb://profile/' + pageID);
			} else {
				jQuery(this).attr('href', currentUrl.replace('web.', ''));
			}
		});
	}


    document.querySelectorAll('.rednote').forEach(button => {
        button.addEventListener('click', function() {
            facebookLinks();
        });
    });
});
