const aboutButton = document.getElementById("aboutButton");
const aboutModal = document.getElementById("aboutCard");
const closeAbout = document.getElementById("closeAbout");

const card = document.getElementById("aboutCardBox");
const dragHandle = document.getElementById("dragHandle");

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

aboutButton.addEventListener("click", function () {
   aboutModal.style.display = "block";
});

closeAbout.addEventListener("click", function () {
   aboutModal.style.display = "none";
});

dragHandle.addEventListener("mousedown", function (event) {
   isDragging = true;
   offsetX = event.clientX - card.offsetLeft;
   offsetY = event.clientY - card.offsetTop;
});

document.addEventListener("mousemove", function (event) {
   if (isDragging) {
      card.style.left = event.clientX - offsetX + "px";
      card.style.top = event.clientY - offsetY + "px";
   }
});

document.addEventListener("mouseup", function () {
   isDragging = false;
});