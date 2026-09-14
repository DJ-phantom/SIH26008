import os

import pandas as pd
import psycopg
import matplotlib.pyplot as plt
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
    current
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

print("\nSTATISTICS")
print(df.describe())


# -----------------------------
# TEMPERATURE GRAPH
# -----------------------------
plt.figure(figsize=(10, 5))

plt.plot(
    df["timestamp"],
    df["temperature"]
)

plt.xlabel("Time")
plt.ylabel("Temperature")
plt.title("Conveyor Temperature Over Time")

plt.xticks(rotation=45)

plt.tight_layout()

plt.show()


# -----------------------------
# VIBRATION GRAPH
# -----------------------------
plt.figure(figsize=(10, 5))

plt.plot(
    df["timestamp"],
    df["vibration"]
)

plt.xlabel("Time")
plt.ylabel("Vibration")
plt.title("Conveyor Vibration Over Time")

plt.xticks(rotation=45)

plt.tight_layout()

plt.show()