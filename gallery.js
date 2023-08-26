class SimpleGallery {
    constructor() {
        this.galleryImages = [];
        this.initialize();
    }
    loadImages(callBack) {
        console.info('Loading video list');
        fetch('.simple_gallery_data/index.json', { cache: 'no-store' })
            .then(response => response.json())
            .then(data => {
            this.galleryImages = data;
        }).then(() => callBack(this))
            .catch(err => {
            console.error(err);
            alert('error: ' + err);
        });
    }
    displayImages() {
        this.gallery.innerHTML = '';
        let newContent = '';
        this.galleryImages.forEach((img) => {
            newContent += `<div class="gallery-image-panel"><img src="${img.thumbnailUrl}" loading="lazy" alt="${img.name}" onclick="galleryApp.displayImage(${img.index})"></div>`;
        });
        this.gallery.innerHTML = newContent;
    }
    displayImage(index) {
        const image = this.galleryImages.find(i => i.index === index);
        console.info("loaded image", image);
        this.image.src = image.url;
        this.image.alt = image.name;
        this.image.onload = () => { this.imageOverlay.classList.toggle('hidden'); };
    }
    hideImage() {
        this.imageOverlay.classList.toggle('hidden');
    }
    initialize() {
        this.gallery = document.querySelector('#gallery-wrapper');
        this.imageOverlay = document.querySelector('#image-wrapper');
        this.imageOverlayCloseBtn = document.querySelector('#close-btn');
        this.imageOverlayCloseBtn.addEventListener('click', () => { this.hideImage(); });
        this.image = document.querySelector('#the-image');
        this.loadImages(() => { this.displayImages(); });
    }
}
let galleryApp;
window.addEventListener('load', () => {
    galleryApp = new SimpleGallery();
});
