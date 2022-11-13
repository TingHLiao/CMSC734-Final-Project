import csv
import sys

from state_names import state_abbre_mapping

dataset = csv.DictReader(open(sys.argv[1]))


processed_dataset = []
for row in dataset:
    state = row['state']
    if state not in state_abbre_mapping.keys(): continue
    row['state'] = state_abbre_mapping[state]
    processed_dataset.append(row)

writer = csv.DictWriter(open(sys.argv[2], 'w'), dataset.fieldnames)
writer.writeheader()

for row in processed_dataset:
    writer.writerow(row)