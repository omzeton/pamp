const imgs = document.getElementsByClassName("post__body--img__container");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("close");
const previewImage = document.getElementById("preview-image");

for (let i of imgs) {
  i.addEventListener("click", function() {
    previewImage.src = this.childNodes[1].src;
    modal.style.zIndex = 9999;
    modal.style.opacity = 1;
  });
}

closeBtn.addEventListener("click", () => {
  modal.style.opacity = 0;
  setTimeout(() => {
    modal.style.zIndex = -9999;
  }, 500);
});
