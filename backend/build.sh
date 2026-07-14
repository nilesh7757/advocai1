#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate

# NOTE: In production DO NOT use the default SQLite database on Render's free/starter services
# because the filesystem is ephemeral and SQLite data will be lost on redeploys/restarts.
# You MUST set a persistent DATABASE_URL environment variable (for example, Render's managed
# Postgres) in the Render service's environment settings so Django admin, sessions and other
# SQL-backed data persist across deploys.