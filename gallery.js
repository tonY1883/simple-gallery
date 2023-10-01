class SimpleGallery {
    constructor() {
        this.initialize();
    }
    static tableFromObject(data, title) {
        console.debug(data);
        let dataTable = document.createElement("table");
        let body = dataTable.createTBody();
        dataTable.createCaption().innerText = title;
        for (const [attribute, value] of Object.entries(data)) {
            if (!!value) {
                let bodyRow = body.insertRow();
                bodyRow.insertCell().innerText = attribute;
                bodyRow.insertCell().innerText = value.toString();
            }
        }
        return dataTable;
    }
    loadImages(callBack) {
        fetch('.simple_gallery_data/index.json', { cache: 'no-store' })
            .then(response => response.json())
            .then((images) => images.sort((a, b) => a.name.localeCompare(b.name)))
            .then((data) => {
            this.galleryImages = data;
            this.albums = new Map();
            data.forEach(element => {
                if (!this.albums.has(element.meta.Directory)) {
                    this.albums.set(element.meta.Directory, new Array());
                }
                this.albums.get(element.meta.Directory).push(element);
            });
        }).then(() => callBack(this))
            .catch(err => {
            console.error(err);
            alert('error: ' + err);
        });
    }
    displayAlbums() {
        this.albumListDisplay.innerHTML = '';
        let newContent = '';
        this.albums.forEach((imgs, dir) => {
            newContent += `<li onclick="galleryApp.displayImages('${dir}')">${dir}<li>`;
        });
        this.albumListDisplay.innerHTML = newContent;
    }
    displayImages(album) {
        this.gallery.innerHTML = '';
        let newContent = '';
        this.albums.get(album).forEach((img) => {
            newContent += `<div class="gallery-image-panel"><img src="${img.thumbnailUrl}" loading="lazy" alt="${img.name}" onclick="galleryApp.displayImage(${img.index})"></div>`;
        });
        this.gallery.innerHTML = newContent;
    }
    displayImage(index) {
        var _a, _b, _c, _d, _e;
        let image = this.galleryImages.find(i => i.index === index);
        if (!!image) {
            this.currentImage = image;
        }
        else {
            return;
        }
        console.info("loaded image", this.currentImage);
        this.image.src = this.currentImage.url;
        this.image.alt = this.currentImage.name;
        this.imageInfoName.innerText = this.currentImage.name;
        this.imageInfoTable.innerHTML = '';
        const meta = {
            "File Meta": {
                Format: this.currentImage.meta.FileType.trim(),
                Size: this.currentImage.meta.FileSize.trim(),
                Directory: this.currentImage.meta.Directory.trim()
            },
            Photography: {
                Dimension: `${this.currentImage.meta.ImageSize.trim()} (${this.currentImage.meta.Megapixels} Megapixels)`,
                Aperture: this.currentImage.meta.Aperture ? `f/${this.currentImage.meta.Aperture}` : null,
                "Shutter Speed": (_a = this.currentImage.meta.ShutterSpeed) === null || _a === void 0 ? void 0 : _a.trim(),
                "Focal Length": (_b = this.currentImage.meta.FocalLength) === null || _b === void 0 ? void 0 : _b.trim(),
                ISO: this.currentImage.meta.ISO,
                "White Balance": (_c = this.currentImage.meta.WhiteBalance) === null || _c === void 0 ? void 0 : _c.trim(), "Camera Model": !!this.currentImage.meta.Make ? !!this.currentImage.meta.Model ? this.currentImage.meta.Make.trim() + ' ' + this.currentImage.meta.Model.trim() : this.currentImage.meta.Make.trim() : !!this.currentImage.meta.Model ? this.currentImage.meta.Model.trim() : null,
            },
            History: {
                "Date": (_d = this.currentImage.meta.CreateDate) === null || _d === void 0 ? void 0 : _d.trim(),
                "Location": (_e = this.currentImage.meta.GPSPosition) === null || _e === void 0 ? void 0 : _e.trim()
            },
        };
        for (const [sectionHeading, sectionData] of Object.entries(meta)) {
            this.imageInfoTable.appendChild(SimpleGallery.tableFromObject(sectionData, sectionHeading));
        }
        this.imageOverlay.classList.remove('hidden');
    }
    toggleImageInfo() {
        this.imageInfoPanel.classList.toggle('hidden');
    }
    hideImage() {
        this.imageOverlay.classList.add('hidden');
    }
    initialize() {
        this.albumListDisplay = document.querySelector('#album-list');
        this.gallery = document.querySelector('#gallery-wrapper');
        this.imageOverlay = document.querySelector('#image-wrapper');
        this.imageOverlayCloseBtn = document.querySelector('#close-btn');
        this.imageOverlayCloseBtn.addEventListener('click', () => { this.hideImage(); });
        this.image = document.querySelector('#the-image');
        this.imageInfoPanel = document.querySelector('#image-info-panel');
        this.imageInfoName = document.querySelector('#image-info-name');
        this.imageInfoTable = document.querySelector('#image-info-table');
        this.imageInfoButton = document.querySelector('#info-btn');
        this.imageInfoButton.addEventListener('click', () => { this.toggleImageInfo(); });
        this.imageNextButton = document.querySelector('#next-btn');
        this.imageNextButton.addEventListener('click', () => { this.displayImage(this.currentImage.index + 1); });
        this.imagePreviousButton = document.querySelector('#previous-btn');
        this.imagePreviousButton.addEventListener('click', () => { this.displayImage(this.currentImage.index - 1); });
        this.loadImages(() => { this.displayAlbums(); });
    }
}
let galleryApp;
window.addEventListener('load', () => {
    galleryApp = new SimpleGallery();
});
