document.addEventListener("DOMContentLoaded", function() {




    document.querySelectorAll('.wifi').forEach(button => {
        button.addEventListener('click', function() {
            alert('This will redirect to the respective page wifi!');
        });
    });


});
