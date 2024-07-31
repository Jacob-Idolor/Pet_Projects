import pandas as pd
import json

def load_and_process_json(file_path):
    with open(file_path, 'r') as file:
        json_data = json.load(file)
    return pd.json_normalize(json_data['data'], sep='_')

def find_names_by_id(df, base_id):
    # Identify columns that might contain name information
    name_columns = [col for col in df.columns if 'name' in col or 'description' in col]
    
    # Find entries that relate to the base_id
    # Assuming 'id' column directly correlates to the base_id or using a relationship mapping
    related_entries = df[df['id'] == base_id]

    # Extract names from these entries based on identified columns
    names = {}
    for col in name_columns:
        if not related_entries.empty:
            # Extract and store names from each relevant column
            names[col] = related_entries[col].unique().tolist()

    return names

def print_names(names):
    if names:
        print("Names associated with the ID:")
        for col, name_list in names.items():
            print(f"{col}: {name_list}")
    else:
        print("No name or description fields associated with the ID.")

# Usage example
if __name__ == "__main__":
    json_file_path = 'PickEm\\PrizePicksLines.json'
    df = load_and_process_json(json_file_path)

    # Specify the ID you are interested in
    base_id = '2314276'
    names = find_names_by_id(df, base_id)
    print_names(names)
