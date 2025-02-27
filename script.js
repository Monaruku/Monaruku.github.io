document.addEventListener("DOMContentLoaded", function() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.querySelector(".facebook").addEventListener("click", function() {
            window.open("fb://page/110600357296339", "_blank");
        });
    }
    else {
            document.querySelector(".facebook").addEventListener("click", function() {
    window.open("https://facebook.com", "_blank");
    });
    }



    document.querySelectorAll('.wifi').forEach(button => {
        button.addEventListener('click', function() {
            alert('This will redirect to the respective page wifi!');
        });
    });


});
