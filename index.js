const aboutButton = document.getElementById("aboutButton");
const popup = document.getElementById("popup");
const closePopup = document.getElementById("closePopup");

aboutButton.addEventListener("click", function () {
   popup.style.display = "block";
});

closePopup.addEventListener("click", function () {
   popup.style.display = "none";
});