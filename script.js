document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.wifi').forEach(button => {
        button.addEventListener('click', function() {
            alert('This will redirect to the respective page wifi!');
        });
    });

    document.querySelector(".facebook").addEventListener("click", function() {
    window.open("fb://page/110600357296339", "_blank");
    });
});
