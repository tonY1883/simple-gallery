class SimpleGallery {
    #albums;
    #galleryImages;
    #currentImage;
    #dbHelper;
    #albumListDisplay;
    #gallery;
    #imageOverlay;
    #imageOverlayCloseBtn;
    #image;
    #imageInfoButton;
    #imageNextButton;
    #imagePreviousButton;
    #imageInfoPanel;
    #imageInfoName;
    #imageInfoTable;
    #imageLocationMap;
    //Lealet map library
    leafletLib;
    #leafletMap;
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
    static getAlbumDisplayId(stringInput) {
        //imitate java's object hash
        let hash = 0;
        for (let i = 0; i < stringInput.length; i++) {
            hash = (hash << 5) - hash + stringInput.charCodeAt(i);
            hash |= 0;
        }
        return "album-" + Math.abs(hash).toString(36); //add string to follow HTML id standard
    }
    constructor() {
        this.initialize();
    }
    loadImages(callBack) {
        this.#dbHelper
            .open()
            .then(() => fetch(".simple_gallery_data/hash.txt", { cache: "no-store" }))
            .then((response) => response.text())
            .then((hash) => {
            const HASH_STORAGE_KEY = "index-hash";
            console.debug("current index signature: " + hash);
            const currentChecksum = localStorage.getItem(HASH_STORAGE_KEY);
            localStorage.setItem(HASH_STORAGE_KEY, hash);
            if (currentChecksum !== hash) {
                console.info("Index outdated or missing, downloading new index");
                return this.#dbHelper
                    .clearIndex()
                    .then(() => fetch(".simple_gallery_data/index.json", { cache: "no-store" }))
                    .then((response) => response.json())
                    .then(async (images) => {
                    await this.#dbHelper.updateImageIndex(images);
                });
            }
            else {
                return Promise.resolve();
            }
        })
            .then(() => this.#dbHelper.getAllImages())
            .then((data) => {
            this.#galleryImages = data;
            this.#albums = {};
            data.forEach((element) => {
                const path = element.textMeta.Directory.toString().split("/");
                let currentDir = this.#albums;
                path.forEach((d) => {
                    if (!!!currentDir[d]) {
                        currentDir[d] = {};
                    }
                    currentDir = currentDir[d];
                });
            });
        })
            .then(() => callBack(this))
            .catch((err) => {
            console.error(err);
            alert("error: " + err);
        });
    }
    displayAlbums() {
        this.#albumListDisplay.innerHTML = "";
        let newContent = document.createDocumentFragment();
        Object.keys(this.#albums).forEach((album) => {
            const item = document.createElement("li");
            item.id = SimpleGallery.getAlbumDisplayId(album);
            item.onclick = (e) => {
                e.stopPropagation();
                galleryApp.displayImages(album);
            };
            item.innerText = album;
            newContent.appendChild(item);
        });
        this.#albumListDisplay.appendChild(newContent);
    }
    displayImages(album) {
        this.#gallery.innerHTML = "";
        //content for current dir
        let newContent = document.createDocumentFragment();
        this.#galleryImages
            .filter((img) => img.textMeta.Directory === album)
            .sort((a, b) => {
            const dateA = new Date(a.textMeta.CreateDate?.replace(/^(\d+):(\d+):(\d+)/, "$1-$2-$3") || 0);
            const dateB = new Date(b.textMeta.CreateDate?.replace(/^(\d+):(\d+):(\d+)/, "$1-$2-$3") || 0);
            const diff = dateA.getTime() - dateB.getTime();
            return diff !== 0 ? diff : a.name.localeCompare(b.name);
        })
            .forEach((img) => {
            const item = document.createElement("div");
            item.id = SimpleGallery.getAlbumDisplayId(album);
            item.classList.add("gallery-image-panel");
            item.onclick = (e) => {
                e.stopPropagation();
                galleryApp.displayImage(img.id);
            };
            const thumbnail = document.createElement("img");
            thumbnail.src = img.thumbnailUrl;
            thumbnail.loading = "lazy";
            thumbnail.alt = img.name;
            item.appendChild(thumbnail);
            newContent.appendChild(item);
        });
        this.#gallery.appendChild(newContent);
        //display subdir
        const currentAlbum = document.querySelector(`#${SimpleGallery.getAlbumDisplayId(album)}`);
        const albumPath = album.toString().split("/");
        //first, check if subdir is already displayed
        if (!!currentAlbum.dataset.open) {
            //remove displayed sublist
            currentAlbum.querySelector("ul")?.remove();
            delete currentAlbum.dataset.open;
        }
        else {
            let currentDir = this.#albums;
            albumPath.forEach((d) => {
                currentDir = currentDir[d];
            });
            const subDirList = document.createElement("ul");
            Object.keys(currentDir).forEach((a) => {
                const item = document.createElement("li");
                item.id = SimpleGallery.getAlbumDisplayId(`${album}/${a}`);
                item.onclick = (e) => {
                    e.stopPropagation();
                    galleryApp.displayImages(`${album}/${a}`);
                };
                item.innerText = a;
                subDirList.appendChild(item);
            });
            if (albumPath.length % 2 > 0) {
                subDirList.classList.add("alt-color");
            }
            currentAlbum.appendChild(subDirList);
            currentAlbum.dataset.open = "true";
        }
    }
    displayImage(id) {
        if (id === this.#currentImage?.id) {
            //simply unhide the detail view
            console.debug("Same image as current image, nothing to do");
            this.#imageOverlay.classList.remove("gone");
            return;
        }
        let image = this.#galleryImages.find((i) => i.id === id);
        if (!!image) {
            this.#currentImage = image;
        }
        else {
            console.error(`Cannot find image with id ${id}`);
            return;
        }
        console.info("loaded image", this.#currentImage);
        this.#image.classList.add("hidden");
        this.#image.src = this.#currentImage.url;
        this.#image.alt = this.#currentImage.name;
        this.#imageInfoName.innerText = this.#currentImage.name;
        this.#imageInfoTable.innerHTML = "";
        const meta = {
            "File Meta": {
                Format: this.#currentImage.textMeta.FileType.trim(),
                Size: this.#currentImage.textMeta.FileSize.trim(),
                Directory: this.#currentImage.textMeta.Directory.trim(),
            },
            Photography: {
                Dimension: `${this.#currentImage.textMeta.ImageSize.trim()} (${this.#currentImage.textMeta.Megapixels} Megapixels)`,
                Aperture: this.#currentImage.textMeta.Aperture ? `f/${this.#currentImage.textMeta.Aperture}` : null,
                "Shutter Speed": this.#currentImage.textMeta.ShutterSpeed?.trim(),
                "Focal Length": this.#currentImage.textMeta.FocalLength?.trim(),
                ISO: this.#currentImage.textMeta.ISO,
                "White Balance": this.#currentImage.textMeta.WhiteBalance?.trim(),
                "Camera Model": !!this.#currentImage.textMeta.Make
                    ? !!this.#currentImage.textMeta.Model
                        ? this.#currentImage.textMeta.Make.trim() + " " + this.#currentImage.textMeta.Model.trim()
                        : this.#currentImage.textMeta.Make.trim()
                    : !!this.#currentImage.textMeta.Model
                        ? this.#currentImage.textMeta.Model.trim()
                        : null,
            },
            History: {
                Date: this.#currentImage.textMeta.CreateDate?.trim(),
                Location: this.#currentImage.textMeta.GPSPosition?.trim(),
            },
        };
        for (const [sectionHeading, sectionData] of Object.entries(meta)) {
            this.#imageInfoTable.appendChild(SimpleGallery.tableFromObject(sectionData, sectionHeading));
        }
        if (!!this.#currentImage.gpsMeta.GPSLatitude && !!this.leafletLib) {
            !!this.#leafletMap && this.#leafletMap.remove();
            this.#leafletMap = this.leafletLib
                .map(this.#imageLocationMap)
                .setView([this.#currentImage.gpsMeta.GPSLatitude, this.#currentImage.gpsMeta.GPSLongitude], 14);
            this.leafletLib
                .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            })
                .addTo(this.#leafletMap);
            this.leafletLib
                .marker([this.#currentImage.gpsMeta.GPSLatitude, this.#currentImage.gpsMeta.GPSLongitude])
                .addTo(this.#leafletMap);
            this.#imageLocationMap.classList.remove("hidden");
        }
        else {
            this.#imageLocationMap.classList.add("hidden");
        }
        this.#imageOverlay.classList.remove("gone");
    }
    toggleImageInfo() {
        this.#imageInfoPanel.classList.toggle("gone");
        if (!!this.#leafletMap) {
            this.#leafletMap.invalidateSize();
        }
    }
    hideImage() {
        this.#imageOverlay.classList.add("gone");
    }
    initialize() {
        this.leafletLib = window["L"];
        this.#albumListDisplay = document.querySelector("#album-list");
        this.#gallery = document.querySelector("#gallery-wrapper");
        this.#imageOverlay = document.querySelector("#image-wrapper");
        this.#imageOverlayCloseBtn = document.querySelector("#close-btn");
        this.#imageOverlayCloseBtn.addEventListener("click", () => {
            this.hideImage();
        });
        this.#image = document.querySelector("#the-image");
        this.#image.onload = () => {
            this.#image.classList.remove("hidden");
        };
        this.#imageInfoPanel = document.querySelector("#image-info-panel");
        this.#imageInfoName = document.querySelector("#image-info-name");
        this.#imageInfoTable = document.querySelector("#image-info-table");
        this.#imageInfoButton = document.querySelector("#info-btn");
        this.#imageInfoButton.addEventListener("click", () => {
            this.toggleImageInfo();
        });
        this.#imageNextButton = document.querySelector("#next-btn");
        this.#imageNextButton.addEventListener("click", () => {
            let index = this.#galleryImages.findIndex((img) => img.id === this.#currentImage.id);
            this.displayImage(this.#galleryImages[index + 1]?.id);
        });
        this.#imagePreviousButton = document.querySelector("#previous-btn");
        this.#imagePreviousButton.addEventListener("click", () => {
            let index = this.#galleryImages.findIndex((img) => img.id === this.#currentImage.id);
            this.displayImage(this.#galleryImages[index - 1]?.id);
        });
        this.#imageLocationMap = document.querySelector("#location-map");
        this.#dbHelper = new GalleryDBHelper("gallery_index", 1);
        this.loadImages(() => {
            document.querySelector("#loading-dialog")?.remove();
            this.displayAlbums();
        });
    }
}
class DBHelper {
    #dbName;
    #dbVersion;
    #dbInstance;
    constructor(name, version = 1) {
        this.#dbName = name;
        this.#dbVersion = version;
    }
    onUpgrade(db, oldVersion, newVersion) { }
    onDelete(db) { }
    onOpen(db) { }
    onError(err) {
        throw err;
    }
    /** Throws error if database is not open */
    async requiresOpenDatabase() {
        if (!!!this.activeDatabase) {
            throw new Error("No open database for operation");
        }
    }
    insert(data, store) {
        return this.requiresOpenDatabase().then(() => new Promise((resolve, reject) => {
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
        }));
    }
    update(data, store) {
        return this.requiresOpenDatabase().then(() => new Promise((resolve, reject) => {
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
        }));
    }
    select(key, store, onError) {
        return this.requiresOpenDatabase().then(() => new Promise((resolve, reject) => {
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
        }));
    }
    selectAll(store, onError) {
        return this.requiresOpenDatabase().then(() => new Promise((resolve, reject) => {
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
        }));
    }
    query(store, onError) {
        return this.requiresOpenDatabase().then(() => new Promise((resolve, reject) => {
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
        }));
    }
    delete(key, store, onError) {
        return this.requiresOpenDatabase().then(() => new Promise((resolve, reject) => {
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
        }));
    }
    deleteAll(store, onError) {
        return this.requiresOpenDatabase().then(() => new Promise((resolve, reject) => {
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
        }));
    }
    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.activeDatabaseName, this.activeDatabaseVersion);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (event.oldVersion === 0) {
                    this.onCreate(db);
                }
                else if (!!!event.newVersion) {
                    this.onDelete(db);
                }
                else if (event.newVersion > event.oldVersion) {
                    this.onUpgrade(db, event.oldVersion, event.newVersion);
                }
            };
            request.onsuccess = (event) => {
                const db = event.target.result;
                this.onOpen(db);
                this.#dbInstance = db;
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
            this.#dbInstance = undefined;
        }
    }
    get activeDatabaseName() {
        return this.#dbName;
    }
    get activeDatabase() {
        return this.#dbInstance;
    }
    get activeDatabaseVersion() {
        return this.#dbVersion;
    }
}
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
