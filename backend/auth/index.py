"""
Регистрация и вход пользователей UPTIME.
POST / с полем action=register — регистрация: {action, name, email, password}
POST / с полем action=login — вход: {action, email, password}
GET / с заголовком X-User-Id — данные текущего пользователя
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = "t_p9705824_digital_asset_manage"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # Регистрация
        if method == "POST" and action == "register":
            name = body.get("name", "").strip()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")

            if not name or not email or not password:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните все поля"})}

            if len(password) < 6:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

            salt = secrets.token_hex(16)
            password_hash = f"{salt}:{hash_password(password, salt)}"

            cur.execute(
                f"INSERT INTO {SCHEMA}.users (name, email, password_hash) VALUES (%s, %s, %s) "
                f"ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash "
                f"RETURNING id",
                (name, email, password_hash)
            )
            user_id = cur.fetchone()[0]
            conn.commit()

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"id": user_id, "name": name, "email": email})}

        # Вход
        if method == "POST" and action == "login":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")

            if not email or not password:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните все поля"})}

            cur.execute(f"SELECT id, name, email, password_hash FROM {SCHEMA}.users WHERE email = %s", (email,))
            row = cur.fetchone()

            if not row:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный email или пароль"})}

            user_id, name, user_email, stored_hash = row
            salt, hashed = stored_hash.split(":", 1)

            if hash_password(password, salt) != hashed:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный email или пароль"})}

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"id": user_id, "name": name, "email": user_email})}

        # Получить пользователя
        if method == "GET":
            user_id = event.get("headers", {}).get("X-User-Id")
            if not user_id:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}

            cur.execute(f"SELECT id, name, email, created_at FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Пользователь не найден"})}

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"id": row[0], "name": row[1], "email": row[2], "created_at": str(row[3])})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Не найдено"})}

    finally:
        cur.close()
        conn.close()