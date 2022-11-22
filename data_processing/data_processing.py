import csv
import sys

from state_names import state_abbre_mapping

dataset = csv.DictReader(open(sys.argv[1]))
vaccine_data = True if sys.argv[1].split('/')[-1] == "state-time_vaccinations.csv" else False

processed_dataset = []
for row in dataset:
    state = row['state']
    if vaccine_data: state = row['state_abbrev']
    if state not in state_abbre_mapping.keys(): continue
    row['state'] = state_abbre_mapping[state]
    if vaccine_data:
        # revise time format to be same as state-timeline.csv
        d = row['date'].split('/')
        d[:2], d[2] = d[1:], d[0]
        row['date'] = '/'.join(d)

    processed_dataset.append(row)

writer = csv.DictWriter(open(sys.argv[2], 'w'), dataset.fieldnames)
writer.writeheader()

for row in processed_dataset:
    writer.writerow(row)