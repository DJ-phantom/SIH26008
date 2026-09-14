import os

import psycopg
from dotenv import load_dotenv


# Load variables from .env
load_dotenv()


DB_CONFIG = {
    "host": os.getenv("PGHOST"),
    "port": os.getenv("PGPORT"),
    "dbname": os.getenv("PGDATABASE"),
    "user": os.getenv("PGUSER"),
    "password": os.getenv("PGPASSWORD"),
}


# --------------------------------------------------
# SAVE ONE TELEMETRY RECORD
# --------------------------------------------------
def save_telemetry(data):

    query = """
        INSERT INTO telemetry (
            conveyor_id,
            timestamp,
            temperature,
            vibration,
            speed,
            current,
            condition
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    values = (
        data.get("conveyor_id", "BC01"),
        data.get("timestamp"),
        data.get("temperature"),
        data.get("vibration"),
        data.get("speed"),
        data.get("current"),
        data.get("condition", "NORMAL"),
    )

    with psycopg.connect(**DB_CONFIG) as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                query,
                values
            )


# --------------------------------------------------
# GET RECENT TELEMETRY
# --------------------------------------------------
def get_recent_telemetry(limit=50):

    query = """
        SELECT
            id,
            conveyor_id,
            timestamp,
            temperature,
            vibration,
            speed,
            current,
            condition
        FROM telemetry
        ORDER BY timestamp DESC
        LIMIT %s
    """

    with psycopg.connect(**DB_CONFIG) as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                query,
                (limit,)
            )

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
            "condition": row[7],
        }

        for row in rows
    ]


# --------------------------------------------------
# GET TELEMETRY BY CONDITION
# --------------------------------------------------
def get_telemetry_by_condition(condition, limit=100):

    query = """
        SELECT
            id,
            conveyor_id,
            timestamp,
            temperature,
            vibration,
            speed,
            current,
            condition
        FROM telemetry
        WHERE condition = %s
        ORDER BY timestamp DESC
        LIMIT %s
    """

    with psycopg.connect(**DB_CONFIG) as connection:

        with connection.cursor() as cursor:

            cursor.execute(
                query,
                (condition, limit)
            )

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
            "condition": row[7],
        }

        for row in rows
    ]