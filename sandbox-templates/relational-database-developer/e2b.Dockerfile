# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install system dependencies required for psycopg2 and mysql-connector-python
RUN apt-get update && \
    apt-get install -y build-essential libpq-dev default-libmysqlclient-dev && \
    rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create a non-root user
RUN adduser --disabled-password --gecos '' user

# Set the working directory
WORKDIR /home/user

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Change ownership to the non-root user
RUN chown -R user:user /home/user

# Switch to the non-root user
USER user

# Command to run the setup script
CMD ["python", "database_setup.py"]