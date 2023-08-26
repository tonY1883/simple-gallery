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
            newContent += `<div class="gallery-image-panel"><img src="${img.thumbnailUrl}" loading="lazy" alt="${img.name}"></div>`;
        });
        this.gallery.innerHTML = newContent;
    }
    initialize() {
        this.gallery = document.querySelector('#gallery-wrapper');
        this.loadImages(() => { this.displayImages(); });
    }
}
let galleryApp;
window.addEventListener('load', () => {
    galleryApp = new SimpleGallery();
});
