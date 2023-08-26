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

dir_name = sys.argv[1]
data_dir_path = Path('.simple_gallery_data')
data_dir_path.mkdir(parents=True, exist_ok=True)
data_dir_path.joinpath('thumbnails').mkdir(exist_ok=True, parents=True)
index = []


def create_thumbnail(path_to_original, path_to_thumbnail):
	#print(str(path_to_original) + " -> " + str(path_to_thumbnail))
	#print(" ".join(['ffmpeg', '-nostdin', '-i', str(path_to_original), "-vf", "scale=trunc(oh*a/2)*2:min(500\,iw)", '-y', str(path_to_thumbnail)]))
	subprocess.run(['ffmpeg', '-nostdin', '-i', str(path_to_original), "-vf", "scale=trunc(oh*a/2)*2:min(500\,iw)", '-y', str(path_to_thumbnail)], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT).stdout.decode('utf-8')

#Only select formats currently supported by browsers
accept_file_formats = [
	'*.[aA][pP][nN][gG]', '*.[aA][vV][iI][fF]', '*.[gG][iI][fF]', '*.[jJ][pP][gG]', '*.[jJ][pP][eE][gG]', '*.[jJ][fF][iI][fF]', '*.[pP][jJ][pP][eE][gG]', '*.[pP][jJ][pP]', '*.[pP][nN][gG]', '*.[sS][vV][gG]', '*.[wW][eE][bB][pP]'
	]
files = list(itertools.chain.from_iterable(map((lambda x: list(Path(dir_name).rglob(x))), accept_file_formats)))
total_count = len(files)
pbar = tqdm(total = total_count, leave = True)
p = multiprocessing.Pool(processes = max(1, int(multiprocessing.cpu_count()/2)))
for idx, file in enumerate(files, start = 1):
	try:
		pbar.update(1)
		if file.is_file():
			info = subprocess.run(['exiftool', '-j', str(file)], stdout=subprocess.PIPE, check=True).stdout.decode('utf-8')
			info = json.loads(info)
			data = {}
			data["name"] = file.name
			data["index"] = idx
			data["url"] = urllib.parse.quote(str(file))
			thumbnail_path = data_dir_path.joinpath('thumbnails').joinpath(str(idx)).with_suffix('.jpg')
			data["thumbnailUrl"] = urllib.parse.quote(str(thumbnail_path))
			data["meta"] = info[0]
			index.append(data)
			#create_thumbnail(file, thumbnail_path)
			p.apply_async(create_thumbnail,[file, thumbnail_path])
	except:
		print("Fail to read " + str(file))
p.close()
p.join()
with open(data_dir_path.joinpath('index.json'), 'w', encoding = 'utf8') as fp:
	json.dump(index, fp, ensure_ascii = False)