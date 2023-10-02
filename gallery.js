class SimpleGallery {
    constructor() {
        this.initialize();
    }
    static tableFromObject(data, title) {
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
                if (!this.albums.has(element.textMeta.Directory)) {
                    this.albums.set(element.textMeta.Directory, new Array());
                }
                this.albums.get(element.textMeta.Directory).push(element);
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
        var _a, _b, _c, _d, _e, _f;
        if (index === ((_a = this.currentImage) === null || _a === void 0 ? void 0 : _a.index)) {
            //simply unhide the detail view
            console.debug("Same image as current image, nothing to do");
            this.imageOverlay.classList.remove('hidden');
            if (!!this.leafletMap) {
                this.leafletMap.invalidateSize();
            }
            return;
        }
        this.image.classList.add('hidden');
        let image = this.galleryImages.find(i => i.index === index);
        if (!!image) {
            this.currentImage = image;
        }
        else {
            console.error(`Cannot find image with index ${index}`);
            return;
        }
        console.info("loaded image", this.currentImage);
        this.image.src = this.currentImage.url;
        this.image.alt = this.currentImage.name;
        this.imageInfoName.innerText = this.currentImage.name;
        this.imageInfoTable.innerHTML = '';
        const meta = {
            "File Meta": {
                Format: this.currentImage.textMeta.FileType.trim(),
                Size: this.currentImage.textMeta.FileSize.trim(),
                Directory: this.currentImage.textMeta.Directory.trim()
            },
            Photography: {
                Dimension: `${this.currentImage.textMeta.ImageSize.trim()} (${this.currentImage.textMeta.Megapixels} Megapixels)`,
                Aperture: this.currentImage.textMeta.Aperture ? `f/${this.currentImage.textMeta.Aperture}` : null,
                "Shutter Speed": (_b = this.currentImage.textMeta.ShutterSpeed) === null || _b === void 0 ? void 0 : _b.trim(),
                "Focal Length": (_c = this.currentImage.textMeta.FocalLength) === null || _c === void 0 ? void 0 : _c.trim(),
                ISO: this.currentImage.textMeta.ISO,
                "White Balance": (_d = this.currentImage.textMeta.WhiteBalance) === null || _d === void 0 ? void 0 : _d.trim(), "Camera Model": !!this.currentImage.textMeta.Make ? !!this.currentImage.textMeta.Model ? this.currentImage.textMeta.Make.trim() + ' ' + this.currentImage.textMeta.Model.trim() : this.currentImage.textMeta.Make.trim() : !!this.currentImage.textMeta.Model ? this.currentImage.textMeta.Model.trim() : null,
            },
            History: {
                "Date": (_e = this.currentImage.textMeta.CreateDate) === null || _e === void 0 ? void 0 : _e.trim(),
                "Location": (_f = this.currentImage.textMeta.GPSPosition) === null || _f === void 0 ? void 0 : _f.trim()
            },
        };
        for (const [sectionHeading, sectionData] of Object.entries(meta)) {
            this.imageInfoTable.appendChild(SimpleGallery.tableFromObject(sectionData, sectionHeading));
        }
        if (!!this.currentImage.gpsMeta.GPSLatitude && !!this.leafletLib) {
            !!this.leafletMap && this.leafletMap.remove();
            this.leafletMap = this.leafletLib.map('location-map').setView([this.currentImage.gpsMeta.GPSLatitude, this.currentImage.gpsMeta.GPSLongitude], 14);
            this.leafletLib.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(this.leafletMap);
            this.leafletLib.marker([this.currentImage.gpsMeta.GPSLatitude, this.currentImage.gpsMeta.GPSLongitude]).addTo(this.leafletMap);
            this.imageLocationMap.classList.remove('hidden');
        }
        else {
            this.imageLocationMap.classList.add('hidden');
        }
        this.imageOverlay.classList.remove('gone');
        if (!!this.leafletMap) {
            this.leafletMap.invalidateSize();
        }
    }
    toggleImageInfo() {
        this.imageInfoPanel.classList.toggle('gone');
    }
    hideImage() {
        this.imageOverlay.classList.add('gone');
    }
    initialize() {
        this.leafletLib = window["L"];
        this.albumListDisplay = document.querySelector('#album-list');
        this.gallery = document.querySelector('#gallery-wrapper');
        this.imageOverlay = document.querySelector('#image-wrapper');
        this.imageOverlayCloseBtn = document.querySelector('#close-btn');
        this.imageOverlayCloseBtn.addEventListener('click', () => { this.hideImage(); });
        this.image = document.querySelector('#the-image');
        this.image.onload = () => { this.image.classList.remove('hidden'); };
        this.imageInfoPanel = document.querySelector('#image-info-panel');
        this.imageInfoName = document.querySelector('#image-info-name');
        this.imageInfoTable = document.querySelector('#image-info-table');
        this.imageInfoButton = document.querySelector('#info-btn');
        this.imageInfoButton.addEventListener('click', () => { this.toggleImageInfo(); });
        this.imageNextButton = document.querySelector('#next-btn');
        this.imageNextButton.addEventListener('click', () => { this.displayImage(this.currentImage.index + 1); });
        this.imagePreviousButton = document.querySelector('#previous-btn');
        this.imagePreviousButton.addEventListener('click', () => { this.displayImage(this.currentImage.index - 1); });
        this.imageLocationMap = document.querySelector('#location-map');
        this.loadImages(() => { this.displayAlbums(); });
    }
}
let galleryApp;
window.addEventListener('load', () => {
    galleryApp = new SimpleGallery();
});
