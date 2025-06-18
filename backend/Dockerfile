# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc python3-dev musl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry (dependency manager)
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple  \
        && pip install --trusted-host pypi.tuna.tsinghua.edu.cn poetry

# Copy only a subset of files for dependency installation to leverage Docker cache
COPY poetry.lock pyproject.toml ./

# Install project dependencies using Poetry
# --no-root: Do not install the project itself as editable, only dependencies
# --no-dev: Do not install development dependencies (like pytest, black, etc.) for production image

RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-ansi --no-root --without dev
RUN poetry cache clear --all pypi

# Copy the rest of the application code
COPY . /app

# Expose port (FastAPI default is 8000)
EXPOSE 8000

# Command to run the application using Uvicorn
# The command in docker-compose.yml will override this if specified there for development (e.g., with --reload)
# For production, this CMD would be the default.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]