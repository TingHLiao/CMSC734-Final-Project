import sys, os, csv
from datetime import datetime
import pandas as pd
from state_names import state_abbrev_mapping

datas = {
    'basic': csv.DictReader(open('dataset/state-time.csv')),
    'vacc': csv.DictReader(open('dataset/state-time_vaccinations_filtered.csv')),
    'hosp': csv.DictReader(open('dataset/hospital.csv')),
    'death': csv.DictReader(open('dataset/Excess_Deaths_Associated_with_COVID-19_filtered.csv'))
}

attrs = {key: datas[key].fieldnames for key in datas.keys()}
merge_attrs = []
for attr in attrs.values():
    for a in attr:
        if a == 'state' or a == 'State' or a == 'state_abbrev' or a == 'State Name' or a == 'Abbrev': 
            continue
        elif a == 'date' or a == 'submission_date' or a == 'Week Ending Date' or a == 'created_at':
            continue
            
        assert a not in merge_attrs
        merge_attrs.append(a)

state_abbrev_mapping_inv = {v: k for k, v in state_abbrev_mapping.items()}
# unify time format and state name
for k in datas.keys():
    data = []
    for i, row in enumerate(datas[k]):
        if k == 'hosp':
            date = datetime.strptime(row['date'], '%Y/%m/%d')
            state_abbrev = row['state']
            if state_abbrev in state_abbrev_mapping.keys():
                state = state_abbrev_mapping[state_abbrev]
            else: continue
        elif k == 'basic':
            date = datetime.strptime(row['submission_date'], '%m/%d/%Y')
            state_abbrev = row['state']
            if state_abbrev in state_abbrev_mapping.keys():
                state = state_abbrev_mapping[state_abbrev]
            else: continue
        elif k == 'death':
            date = datetime.strptime(row['Week Ending Date'], '%m/%d/%Y')
            state = row['State']
            if state in state_abbrev_mapping_inv.keys():
                state_abbrev = state_abbrev_mapping_inv[state]
            else: continue
        elif k == 'vacc':
            date = datetime.strptime(row['submission_date'], '%m/%d/%Y')
            state = row['state']
            state_abbrev = row['state_abbrev']

        row['date'] = date
        row['state'] = state
        row['state_abbrev'] = state_abbrev
        data.append(row)

    datas[k] = data

for k in datas.keys():
    datas[k] = sorted(datas[k], key=lambda k: (k['date'], k['state_abbrev']))

merge_by_states = {}
for k in datas.keys():
    for row in datas[k]:
        state_abbrev = row['state_abbrev']
        date = row['date']
        if state_abbrev not in merge_by_states.keys():
            merge_by_states[state_abbrev] = {}
        
        if date not in merge_by_states[state_abbrev].keys():
            merge_by_states[state_abbrev][date] = {}

        origin_row = merge_by_states[state_abbrev][date]
        merge_by_states[state_abbrev][date] = {**origin_row, **row}


full_attrs = ['date', 'state', 'state_abbrev'] + merge_attrs
all_rows = []
for state_abbrev in merge_by_states.keys():
    state_data = []
    for date in merge_by_states[state_abbrev].keys():
        row = {
            'date': date, 
            'state': state_abbrev_mapping[state_abbrev], 
            'state_abbrev': state_abbrev
        }
        for attr in merge_attrs:
            try:
                value = merge_by_states[state_abbrev][date][attr]
            except:
                value = 'N/A'
            if value == '':
                value = 'N/A'
            row[attr] = value
        state_data.append(row)
    
    state_csv_fn = f'dataset/states/{state_abbrev}.csv'
    f = open(state_csv_fn, 'w')
    state_csv = csv.DictWriter(f, fieldnames=full_attrs)
    state_csv.writeheader()
    state_data = sorted(state_data, key=lambda k: k['date'])
    for row in state_data:
        row['date'] = row['date'].strftime('%Y/%m/%d')
        state_csv.writerow(row)
    f.close()
    df = pd.read_csv(state_csv_fn)
    newdf = df.interpolate(method='linear')
    df.to_csv(state_csv_fn[:-4] + '_fill.csv', sep=',', encoding='utf-8', index=False)
    state_csv = csv.DictReader(open(state_csv_fn[:-4] + '_fill.csv'), fieldnames=full_attrs)
    for row in state_csv:
        if row['date'] == 'date': continue
        all_rows.append(row)

all_rows = sorted(all_rows, key=lambda k: (k['date'], k['state_abbrev']))

merge = csv.DictWriter(open('dataset/merge.csv', 'w'), fieldnames=full_attrs)
merge.writeheader()
for row in all_rows:
    merge.writerow(row)
