#!/usr/bin/env python3
import itertools
import sys
import os
from pathlib import Path
import json
from tqdm import tqdm
import urllib.parse
import subprocess

dir_name = sys.argv[1]
data_dir_path = Path('.simple_gallery_data')
index = []

#Only select formats currently supported by browsers
accept_file_formats = [
	'*.[aA][pP][nN][gG]', '*.[aA][vV][iI][fF]', '*.[gG][iI][fF]', '*.[jJ][pP][gG]', '*.[jJ][pP][eE][gG]', '*.[jJ][fF][iI][fF]', '*.[pP][jJ][pP][eE][gG]', '*.[pP][jJ][pP]', '*.[pP][nN][gG]', '*.[sS][vV][gG]', '*.[wW][eE][bB][pP]'
	]
files = list(itertools.chain.from_iterable(map((lambda x: list(Path(dir_name).rglob(x))), accept_file_formats)))
total_count = len(files)
pbar = tqdm(total = total_count, leave = True)
for idx, file in enumerate(files, start = 1):
	try:
		pbar.update(1)
		if file.is_file():
			info = subprocess.run(['exiftool', '-j', str(file)], stdout=subprocess.PIPE, check=True).stdout.decode('utf-8')
			info = json.loads(info)
			data = {}
			data["name"] = file.name
			data["url"] = urllib.parse.quote(str(file))
			data["meta"] = info[0]
			index.append(data)
	except:
		print("Fail to read " + str(file))
data_dir_path.mkdir(parents=True, exist_ok=True)
with open(data_dir_path.joinpath('index.json'), 'w', encoding = 'utf8') as fp:
	json.dump(index, fp, ensure_ascii = False)