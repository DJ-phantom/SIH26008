import os

import psycopg
from dotenv import load_dotenv


load_dotenv()


DB_CONFIG = {
    "host": os.getenv("PGHOST"),
    "port": os.getenv("PGPORT"),
    "dbname": os.getenv("PGDATABASE"),
    "user": os.getenv("PGUSER"),
    "password": os.getenv("PGPASSWORD"),
}


def save_telemetry(data):
    query = """
        INSERT INTO telemetry (
            conveyor_id,
            timestamp,
            temperature,
            vibration,
            speed,
            current
        )
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    values = (
        data["conveyor_id"],
        data["timestamp"],
        data["temperature"],
        data["vibration"],
        data["speed"],
        data["current"],
    )

    with psycopg.connect(**DB_CONFIG) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, values)


def get_recent_telemetry(limit=50):
    query = """
        SELECT
            id,
            conveyor_id,
            timestamp,
            temperature,
            vibration,
            speed,
            current
        FROM telemetry
        ORDER BY timestamp DESC
        LIMIT %s
    """

    with psycopg.connect(**DB_CONFIG) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, (limit,))
            rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "conveyor_id": row[1],
            "timestamp": row[2],
            "temperature": row[3],
            "vibration": row[4],
            "speed": row[5],
            "current": row[6],
        }
        for row in rows
    ]