FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the Django project
COPY . .

# Expose backend port
EXPOSE 8000

# Start Django with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "pdfEditor.wsgi:application"]
