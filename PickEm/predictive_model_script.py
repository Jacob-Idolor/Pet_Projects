import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler

def main():
    # Load the dataset
    df = pd.read_csv('PickEm\combined_data.csv')

    # Basic Data Preprocessing
    df['GAME_DATE'] = pd.to_datetime(df['GAME_DATE'], errors='coerce')
    df['BIRTH_DATE'] = pd.to_datetime(df['BIRTH_DATE'], errors='coerce')
    df['Age'] = df['GAME_DATE'].dt.year - df['BIRTH_DATE'].dt.year

    # More feature engineering as needed
    # ...

    # Create Target Variable
    df['Target'] = (df['PTS'] > df['Line Score']).astype(int)

    # Selecting relevant features for the model
    features = ['Age', 'FG_PCT', 'FT_PCT', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PTS', 'PLUS_MINUS']
    X = df[features]

    # Split data into training and testing sets
    y = df['Target']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    # Scaling features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Model Training
    model = RandomForestClassifier(random_state=42)
    model.fit(X_train_scaled, y_train)

    # Model Evaluation
    y_pred = model.predict(X_test_scaled)
    print(classification_report(y_test, y_pred))

    # Making Predictions on the entire dataset
    df_scaled = scaler.transform(df[features])
    df['Predictions'] = model.predict(df_scaled)

    # Group by 'Player Name' and 'Stat Type', and summarize predictions
    grouped = df.groupby(['Player Name', 'Stat Type']).agg(
        Total_Games=('Predictions', 'count'),
        Predicted_Over=('Predictions', lambda x: (x == 1).sum()),
        Predicted_Under=('Predictions', lambda x: (x == 0).sum())
    ).reset_index()

    # Displaying the results
    print(grouped)

if __name__ == '__main__':
    main()
