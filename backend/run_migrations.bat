@echo off
echo Applying migrations...
python manage.py migrate
echo.
echo Migrations completed!
pause

