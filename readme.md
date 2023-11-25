# Simple Gallery

A simple, minimal, lightweight static web photo gallery.

## Prerequisite

- A web server that is capable of serving static files(e.g. Apache, NGINX, or even simple `http-server`)
- Python(For indexing your photos)
- FFmpeg(For creating image thumbnails)
- Some photos to show

## Dependency
- Map for showing the photo location is powered by [Leaflet](https://github.com/Leaflet/Leaflet).

## Usage
### Setting up
1. Put the files from this repo in the same folder you store the photos.
2. Run the indexing script in the directory.
```
./index.py .
```
3. Configure your web server to serve the folder with your photo.
4. Done!
### How to add more photos?
Add the new photos to your folder then run the indexing script again.