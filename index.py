#!/usr/bin/env python3
import itertools
import sys
import os
from pathlib import Path
import json
from tqdm import tqdm
import urllib.parse
import subprocess
import multiprocessing

def remove_dir(pth: Path):
	for child in pth.iterdir():
		if child.is_file():
			child.unlink()
		else:
			remove_dir(child)
	pth.rmdir()

def create_thumbnail(path_to_original, path_to_thumbnail):
	#print(str(path_to_original) + " -> " + str(path_to_thumbnail))
	#print(" ".join(['ffmpeg', '-nostdin', '-i', str(path_to_original), "-vf", "scale=trunc(oh*a/2)*2:min(500\,iw)", '-y', str(path_to_thumbnail)]))
	subprocess.run(['ffmpeg', '-nostdin', '-i', str(path_to_original), "-vf", "scale=trunc(oh*a/2)*2:min(500\,iw)", '-y', str(path_to_thumbnail)], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT).stdout.decode('utf-8')

def is_already_indexed(file_path: Path) -> bool:
	global index
	for img in index:
		if img["url"] == urllib.parse.quote(str(file_path)):
			return True
	return False


dir_name = sys.argv[1]
data_dir_path = Path('.simple_gallery_data')
#cleanup old data
if data_dir_path.exists():
	print("Loading existing indices...")
	with open(data_dir_path.joinpath('index.json')) as fp:
		index = json.load(fp)
		print(f"Loaded {len(index)} indices")
		#scan existing indices to check if they still exist
		print("Checking indexed files...")
		temp_index = [img for img in index if Path(urllib.parse.unquote(img["url"])).exists() and Path(urllib.parse.unquote(img["thumbnailUrl"])).exists()]
		print(f"Found {len(temp_index)} image files")
		index = temp_index
else:
	data_dir_path.mkdir(parents=True, exist_ok=True)
	data_dir_path.joinpath('thumbnails').mkdir(exist_ok=True, parents=True)
	index = []
#add new images
#Only select formats currently supported by browsers
print("Indexing...")
accept_file_formats = [
	'*.[aA][pP][nN][gG]', '*.[aA][vV][iI][fF]', '*.[gG][iI][fF]', '*.[jJ][pP][gG]', '*.[jJ][pP][eE][gG]', '*.[jJ][fF][iI][fF]', '*.[pP][jJ][pP][eE][gG]', '*.[pP][jJ][pP]', '*.[pP][nN][gG]', '*.[sS][vV][gG]', '*.[wW][eE][bB][pP]'
	]
files = list(itertools.chain.from_iterable(map((lambda x: list(Path(dir_name).rglob(x))), accept_file_formats)))
total_count = len(files)
total_indexed_count = len(index);
pbar = tqdm(total = total_count, leave = True)
p = multiprocessing.Pool(processes = max(1, int(multiprocessing.cpu_count()/2)))
for idx, file in enumerate(files, start = 1):
	try:
		pbar.update(1)
		if not is_already_indexed(file):
			if file.is_file() and not data_dir_path in file.parents:
				info = subprocess.run(['exiftool','-FileType', '-FileSize', '-Directory', '-Megapixels', '-ImageSize', '-Aperture', '-ShutterSpeed', '-FocalLength', '-ISO', '-WhiteBalance', '-CreateDate', '-Make', '-Model', '-GPSPosition', '-j', str(file)], stdout=subprocess.PIPE, check=True).stdout.decode('utf-8')
				info = json.loads(info)
				data = {}
				data["name"] = file.name
				data["id"] = total_indexed_count + idx
				data["url"] = urllib.parse.quote(str(file))
				thumbnail_path = data_dir_path.joinpath('thumbnails').joinpath(str(total_indexed_count + idx)).with_suffix('.jpg')
				data["thumbnailUrl"] = urllib.parse.quote(str(thumbnail_path))
				data["textMeta"] = info[0]
				info = subprocess.run(['exiftool', '-n', '-GPSLatitude', '-GPSLongitude', '-j', str(file)], stdout=subprocess.PIPE, check=True).stdout.decode('utf-8')
				info = json.loads(info)
				data["gpsMeta"] = info[0]
				index.append(data)
				#create_thumbnail(file, thumbnail_path)
				p.apply_async(create_thumbnail,[file, thumbnail_path])
		else:
			#print(f'{str(file)}: already indexed, skipping')
			pass
			
	except Exception as e:
		print("Fail to read " + str(file))
		#print(e)
p.close()
p.join()
with open(data_dir_path.joinpath('index.json'), 'w', encoding = 'utf8') as fp:
	json.dump(index, fp, ensure_ascii = False)