import os

import matplotlib.pyplot as plt
import pandas as pd
import psycopg
from dotenv import load_dotenv

load_dotenv()


# -----------------------------
# CONNECT TO POSTGRESQL
# -----------------------------
connection = psycopg.connect(
    host=os.getenv("PGHOST"),
    port=os.getenv("PGPORT"),
    dbname=os.getenv("PGDATABASE"),
    user=os.getenv("PGUSER"),
    password=os.getenv("PGPASSWORD"),
)


# -----------------------------
# GET TELEMETRY
# -----------------------------
query = """
SELECT
    timestamp,
    temperature,
    vibration,
    speed,
    current,
    condition
FROM telemetry
ORDER BY timestamp ASC
LIMIT 1000;
"""

df = pd.read_sql(query, connection)

connection.close()


# -----------------------------
# PRINT BASIC INFORMATION
# -----------------------------
print("\nFIRST 5 ROWS")
print(df.head())

print("\nDATA INFORMATION")
df.info()

print("\nDESCRIPTIVE STATISTICS")
print(df.describe())

print("\nROWS PER CONDITION")
print(df["condition"].value_counts())

print("\nAVERAGE VALUES BY CONDITION")
avg_by_condition = df.groupby("condition")[
    ["temperature", "vibration", "speed", "current"]
].mean()
print(avg_by_condition)


# -----------------------------
# GRAPH 1: Temperature by Conveyor Condition
# -----------------------------
plt.figure(figsize=(10, 5))
for condition, group in df.groupby("condition"):
    plt.scatter(group["timestamp"], group["temperature"], label=condition, alpha=0.7)

plt.xlabel("Time")
plt.ylabel("Temperature")
plt.title("Temperature by Conveyor Condition")
plt.xticks(rotation=45)
plt.legend()
plt.tight_layout()
plt.show()


# -----------------------------
# GRAPH 2: Vibration by Conveyor Condition
# -----------------------------
plt.figure(figsize=(10, 5))
for condition, group in df.groupby("condition"):
    plt.scatter(group["timestamp"], group["vibration"], label=condition, alpha=0.7)

plt.xlabel("Time")
plt.ylabel("Vibration")
plt.title("Vibration by Conveyor Condition")
plt.xticks(rotation=45)
plt.legend()
plt.tight_layout()
plt.show()


# -----------------------------
# GRAPH 3: Vibration vs Current by Condition
# -----------------------------
plt.figure(figsize=(8, 6))
for condition, group in df.groupby("condition"):
    plt.scatter(group["vibration"], group["current"], label=condition, alpha=0.7)

plt.xlabel("Vibration")
plt.ylabel("Current")
plt.title("Vibration vs Current by Condition")
plt.legend()
plt.tight_layout()
plt.show()