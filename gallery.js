var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DBHelper_dbName, _DBHelper_dbVersion, _DBHelper_dbInstance;
class SimpleGallery {
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
    constructor() {
        this.initialize();
    }
    loadImages(callBack) {
        this.dbHelper.open().then(() => this.dbHelper.clearIndex()).then(() => fetch(".simple_gallery_data/index.json", { cache: "no-store" }))
            .then((response) => response.json())
            .then((images) => this.dbHelper.updateImageIndex(images))
            .then(() => this.dbHelper.getAllImages())
            .then((data) => {
            this.galleryImages = data;
            this.albums = new Map();
            data.forEach((element) => {
                if (!this.albums.has(element.textMeta.Directory)) {
                    this.albums.set(element.textMeta.Directory, new Array());
                }
                this.albums.get(element.textMeta.Directory).push(element);
            });
        })
            .then(() => callBack(this))
            .catch((err) => {
            console.error(err);
            alert("error: " + err);
        });
    }
    displayAlbums() {
        this.albumListDisplay.innerHTML = "";
        let newContent = "";
        this.albums.forEach((imgs, dir) => {
            newContent += `<li onclick="galleryApp.displayImages('${dir}')">${dir}<li>`;
        });
        this.albumListDisplay.innerHTML = newContent;
    }
    displayImages(album) {
        this.gallery.innerHTML = "";
        let newContent = "";
        this.albums.get(album).forEach((img) => {
            newContent += `<div class="gallery-image-panel"><img src="${img.thumbnailUrl}" loading="lazy" alt="${img.name}" onclick="galleryApp.displayImage(${img.id})"></div>`;
        });
        this.gallery.innerHTML = newContent;
    }
    displayImage(id) {
        if (id === this.currentImage?.id) {
            //simply unhide the detail view
            console.debug("Same image as current image, nothing to do");
            this.imageOverlay.classList.remove("gone");
            return;
        }
        let image = this.galleryImages.find((i) => i.id === id);
        if (!!image) {
            this.currentImage = image;
        }
        else {
            console.error(`Cannot find image with id ${id}`);
            return;
        }
        console.info("loaded image", this.currentImage);
        this.image.classList.add("hidden");
        this.image.src = this.currentImage.url;
        this.image.alt = this.currentImage.name;
        this.imageInfoName.innerText = this.currentImage.name;
        this.imageInfoTable.innerHTML = "";
        const meta = {
            "File Meta": {
                Format: this.currentImage.textMeta.FileType.trim(),
                Size: this.currentImage.textMeta.FileSize.trim(),
                Directory: this.currentImage.textMeta.Directory.trim(),
            },
            Photography: {
                Dimension: `${this.currentImage.textMeta.ImageSize.trim()} (${this.currentImage.textMeta.Megapixels} Megapixels)`,
                Aperture: this.currentImage.textMeta.Aperture ? `f/${this.currentImage.textMeta.Aperture}` : null,
                "Shutter Speed": this.currentImage.textMeta.ShutterSpeed?.trim(),
                "Focal Length": this.currentImage.textMeta.FocalLength?.trim(),
                ISO: this.currentImage.textMeta.ISO,
                "White Balance": this.currentImage.textMeta.WhiteBalance?.trim(),
                "Camera Model": !!this.currentImage.textMeta.Make
                    ? !!this.currentImage.textMeta.Model
                        ? this.currentImage.textMeta.Make.trim() + " " + this.currentImage.textMeta.Model.trim()
                        : this.currentImage.textMeta.Make.trim()
                    : !!this.currentImage.textMeta.Model
                        ? this.currentImage.textMeta.Model.trim()
                        : null,
            },
            History: {
                Date: this.currentImage.textMeta.CreateDate?.trim(),
                Location: this.currentImage.textMeta.GPSPosition?.trim(),
            },
        };
        for (const [sectionHeading, sectionData] of Object.entries(meta)) {
            this.imageInfoTable.appendChild(SimpleGallery.tableFromObject(sectionData, sectionHeading));
        }
        if (!!this.currentImage.gpsMeta.GPSLatitude && !!this.leafletLib) {
            !!this.leafletMap && this.leafletMap.remove();
            this.leafletMap = this.leafletLib
                .map(this.imageLocationMap)
                .setView([this.currentImage.gpsMeta.GPSLatitude, this.currentImage.gpsMeta.GPSLongitude], 14);
            this.leafletLib
                .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            })
                .addTo(this.leafletMap);
            this.leafletLib.marker([this.currentImage.gpsMeta.GPSLatitude, this.currentImage.gpsMeta.GPSLongitude]).addTo(this.leafletMap);
            this.imageLocationMap.classList.remove("hidden");
        }
        else {
            this.imageLocationMap.classList.add("hidden");
        }
        this.imageOverlay.classList.remove("gone");
    }
    toggleImageInfo() {
        this.imageInfoPanel.classList.toggle("gone");
        if (!!this.leafletMap) {
            this.leafletMap.invalidateSize();
        }
    }
    hideImage() {
        this.imageOverlay.classList.add("gone");
    }
    initialize() {
        this.leafletLib = window["L"];
        this.albumListDisplay = document.querySelector("#album-list");
        this.gallery = document.querySelector("#gallery-wrapper");
        this.imageOverlay = document.querySelector("#image-wrapper");
        this.imageOverlayCloseBtn = document.querySelector("#close-btn");
        this.imageOverlayCloseBtn.addEventListener("click", () => {
            this.hideImage();
        });
        this.image = document.querySelector("#the-image");
        this.image.onload = () => {
            this.image.classList.remove("hidden");
        };
        this.imageInfoPanel = document.querySelector("#image-info-panel");
        this.imageInfoName = document.querySelector("#image-info-name");
        this.imageInfoTable = document.querySelector("#image-info-table");
        this.imageInfoButton = document.querySelector("#info-btn");
        this.imageInfoButton.addEventListener("click", () => {
            this.toggleImageInfo();
        });
        this.imageNextButton = document.querySelector("#next-btn");
        this.imageNextButton.addEventListener("click", () => {
            let index = this.galleryImages.findIndex((img) => img.id === this.currentImage.id);
            this.displayImage(this.galleryImages[index + 1]?.id);
        });
        this.imagePreviousButton = document.querySelector("#previous-btn");
        this.imagePreviousButton.addEventListener("click", () => {
            let index = this.galleryImages.findIndex((img) => img.id === this.currentImage.id);
            this.displayImage(this.galleryImages[index - 1]?.id);
        });
        this.imageLocationMap = document.querySelector("#location-map");
        this.dbHelper = new GalleryDBHelper("gallery_index", 1);
        this.loadImages(() => {
            document.querySelector("#loading-dialog")?.remove();
            this.displayAlbums();
        });
    }
}
class DBHelper {
    constructor(name, version) {
        _DBHelper_dbName.set(this, void 0);
        _DBHelper_dbVersion.set(this, void 0);
        _DBHelper_dbInstance.set(this, void 0);
        __classPrivateFieldSet(this, _DBHelper_dbName, name, "f");
        if (!!!version) {
            throw new Error("Database vserion is not valid!");
        }
        __classPrivateFieldSet(this, _DBHelper_dbVersion, version, "f");
    }
    onUpgrade(db, oldVersion, newVersion) { }
    onDelete(db) { }
    onOpen(db) { }
    onError(err) {
        throw err;
    }
    insert(data, store) {
        return new Promise((resolve, reject) => {
            const transaction = this.activeDatabase.transaction(store, "readwrite");
            const resultKeys = new Array();
            transaction.oncomplete = (event) => {
                resolve(resultKeys);
            };
            transaction.onerror = (event) => {
                reject(event.target.error);
            };
            const objectStore = transaction.objectStore(store);
            data.forEach((datum) => {
                const request = objectStore.add(datum);
                request.onsuccess = (event) => {
                    resultKeys.push(event.target.result);
                };
            });
        });
    }
    update(data, store) {
        return new Promise((resolve, reject) => {
            const transaction = this.activeDatabase.transaction(store, "readwrite");
            const resultKeys = new Array();
            transaction.oncomplete = (event) => {
                resolve(resultKeys);
            };
            transaction.onerror = (event) => {
                reject(event.target.error);
            };
            const objectStore = transaction.objectStore(store);
            data.forEach((datum) => {
                const request = objectStore.put(datum);
                request.onsuccess = (event) => {
                    resultKeys.push(event.target.result);
                };
            });
        });
    }
    select(key, store, onError) {
        return new Promise((resolve, reject) => {
            const objectStore = this.activeDatabase.transaction(store).objectStore(store);
            const request = objectStore.get(key);
            request.onerror = (event) => {
                const err = event.target.error;
                if (!!onError) {
                    onError(err);
                }
                else {
                    reject(err);
                }
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }
    selectAll(store, onError) {
        return new Promise((resolve, reject) => {
            const objectStore = this.activeDatabase.transaction(store).objectStore(store);
            const request = objectStore.getAll();
            request.onerror = (event) => {
                const err = event.target.error;
                if (!!onError) {
                    onError(err);
                }
                else {
                    reject(err);
                }
            };
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }
    query(store, onError) {
        return new Promise((resolve, reject) => {
            const objectStore = this.activeDatabase.transaction(store).objectStore(store);
            const request = objectStore.openCursor();
            request.onerror = (event) => {
                const err = event.target.error;
                if (!!onError) {
                    onError(err);
                }
                else {
                    reject(err);
                }
            };
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                const result = new Array();
                if (cursor) {
                    result.push(cursor.value);
                    cursor.continue();
                }
                else {
                    resolve(result);
                }
            };
        });
    }
    delete(key, store, onError) {
        return new Promise((resolve, reject) => {
            const objectStore = this.activeDatabase.transaction(store, "readwrite").objectStore(store);
            const request = objectStore.delete(key);
            request.onerror = (event) => {
                const err = event.target.error;
                if (!!onError) {
                    onError(err);
                }
                else {
                    reject(err);
                }
            };
            request.onsuccess = (event) => {
                resolve();
            };
        });
    }
    deleteAll(store, onError) {
        return new Promise((resolve, reject) => {
            const objectStore = this.activeDatabase.transaction(store, "readwrite").objectStore(store);
            const request = objectStore.clear();
            request.onerror = (event) => {
                const err = event.target.error;
                if (!!onError) {
                    onError(err);
                }
                else {
                    reject(err);
                }
            };
            request.onsuccess = (event) => {
                resolve();
            };
        });
    }
    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("gallery_index", 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (event.oldVersion === 0) {
                    this.onCreate(db);
                }
                else if (event.newVersion > event.oldVersion) {
                    this.onUpgrade(db, event.oldVersion, event.newVersion);
                }
                else if (!!!event.newVersion) {
                    this.onDelete(db);
                }
            };
            request.onsuccess = (event) => {
                const db = event.target.result;
                this.onOpen(db);
                __classPrivateFieldSet(this, _DBHelper_dbInstance, db, "f");
                resolve(db);
            };
            request.onerror = (event) => {
                this.onError(event.target.error);
                reject();
            };
        });
    }
    /**
     * close
     */
    close() {
        if (!!this.activeDatabase) {
            this.activeDatabase.close();
        }
    }
    get activeDatabaseName() {
        return __classPrivateFieldGet(this, _DBHelper_dbName, "f");
    }
    get activeDatabase() {
        return __classPrivateFieldGet(this, _DBHelper_dbInstance, "f");
    }
}
_DBHelper_dbName = new WeakMap(), _DBHelper_dbVersion = new WeakMap(), _DBHelper_dbInstance = new WeakMap();
class GalleryDBHelper extends DBHelper {
    onCreate(db) {
        const objectStore = db.createObjectStore("images", { keyPath: "id" });
        objectStore.createIndex("album", "textMeta.Directory", { unique: false });
        objectStore.createIndex("id", "id", { unique: true });
    }
    onError(err) {
        super.onError(err);
        alert(err);
    }
    clearIndex() {
        return this.deleteAll("images");
    }
    updateImageIndex(data) {
        return super.update(data, "images");
    }
    getImage(id) {
        return super.select(id, "images");
    }
    getAllImages() {
        return super.selectAll("images");
    }
}
let galleryApp;
window.addEventListener("load", () => {
    galleryApp = new SimpleGallery();
});
