import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_database_connection():
    try:
        connection = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor,)
        return connection

    except Exception as error:
        print("=" * 50)
        print("ERROR: Could not connect to the database!")
        print("Check: Is PostgreSQL running? Is your .env DATABASE_URL correct?")
        print(f"Details: {error}")
        print("=" * 50)
        return None