import sys, os, csv
from datetime import datetime
import pandas as pd
from state_names import state_abbrev_mapping

data = csv.DictReader(open('../dataset/merge.csv'))
attr = data.fieldnames
merge_by_states = {}

for row in data:
    state_abbrev = row['state_abbrev']
    date = row['date']
    if state_abbrev not in merge_by_states.keys():
        merge_by_states[state_abbrev] = {}
    
    if date not in merge_by_states[state_abbrev].keys():
        merge_by_states[state_abbrev][date] = {}

    origin_row = merge_by_states[state_abbrev][date]
    merge_by_states[state_abbrev][date] = {**origin_row, **row}


total_attr = {"total_new_case":0, "total_new_death":0, "total_daily_vaccinations":0, "total_inpatient_beds_used":0, "total_inpatient_beds_used_covid":0, "total_Excess Estimate":0}

for state_abbrev in merge_by_states.keys():
    for date in merge_by_states[state_abbrev].keys():
        for a in total_attr.keys():
            if merge_by_states[state_abbrev][date][a[6:]] == '':
                merge_by_states[state_abbrev][date][a[6:]] = '0'
            merge_by_states[state_abbrev][date][a] = total_attr[a]+int(merge_by_states[state_abbrev][date][a[6:]])
            total_attr[a] = merge_by_states[state_abbrev][date][a]


all_rows = []
for state_abbrev in merge_by_states.keys():
    for date in merge_by_states[state_abbrev].keys():
        all_rows.append(merge_by_states[state_abbrev][date])

full_attrs = attr[:7] + list(total_attr.keys()) + attr[7:]


merge = csv.DictWriter(open('../dataset/merge_accum.csv', 'w'), fieldnames=full_attrs)
merge.writeheader()
for row in all_rows:
    merge.writerow(row)
