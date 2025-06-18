from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration
import time
import logging

from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Sentry if DSN is configured
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=str(settings.SENTRY_DSN),
        environment=settings.ENVIRONMENT,
        integrations=[
            FastApiIntegration(),
            RedisIntegration(),
        ],
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        traces_sample_rate=1.0,
        # Set profiles_sample_rate to 1.0 to profile 100%
        # of sampled transactions.
        profiles_sample_rate=1.0,
    )
    logger.info("Sentry initialized successfully.")

# Define Prometheus metrics
HTTP_REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code']
)

HTTP_REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

# Middleware for metrics collection
class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = None
        try:
            response = await call_next(request)
            return response
        finally:
            if response:
                duration = time.time() - start_time
                HTTP_REQUEST_COUNT.labels(
                    method=request.method,
                    endpoint=request.url.path,
                    status_code=response.status_code
                ).inc()
                HTTP_REQUEST_DURATION.labels(
                    method=request.method,
                    endpoint=request.url.path
                ).observe(duration)
# import asyncio # Not strictly needed if all startup/shutdown events are synchronous
# from app import tasks # tasks will be imported via schedule_jobs
from app.core.scheduler import scheduler # Import the scheduler instance
from app.tasks import schedule_jobs # Import the function to add jobs
# from .core.config import settings # Duplicate import of settings

# Import the synchronous redis_client instance
from app.core.redis import redis_client, SyncRedisClient # Import SyncRedisClient for type hinting if needed, and redis_client instance

app = FastAPI(
    redirect_slashes=False,
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="API for monitoring Freqtrade instances and Binance accounts.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add metrics middleware
app.add_middleware(MetricsMiddleware)

# CORS (Cross-Origin Resource Sharing)
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Import the main API router
# This should include all other routers, including auth.py's router
from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event(): # Changed to synchronous
    print("Application startup...")
    # Initialize database (optional, usually for dev/testing, Alembic for prod)
    # print("Database initialized.")
    
    # Redis connection is established when redis_client is imported and initialized.
    # We can ping here to confirm.
    if redis_client:
        if redis_client.ping():
            print("Successfully connected to Redis (checked on startup).")
        else:
            print("ERROR: Failed to connect to Redis on startup (ping failed).")
            # Depending on the application's reliance on Redis, you might want to:
            # raise RuntimeError("Failed to connect to Redis") 
    else:
        print("WARNING: Redis client is None on startup.")

    # Add scheduled jobs
    schedule_jobs() # Call the function to add all jobs to the scheduler

    # Start the scheduler if it's not already running
    if not scheduler.running:
        scheduler.start()
        print("Scheduler started.")
    else:
        print("Scheduler is already running or was started by another process.")

    # Print all registered routes
    print("Registered routes:")
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"Path: {route.path}, Name: {route.name}, Methods: {getattr(route, 'methods', 'N/A')}")
        elif hasattr(route, "include_in_schema") and not route.include_in_schema:
            # For mounted applications or routers that might not have a simple path
            if hasattr(route, "routes"):
                 for sub_route in route.routes:
                    if hasattr(sub_route, "path"):
                        print(f"  Sub-Path: {route.path_format}{sub_route.path}, Name: {sub_route.name}, Methods: {getattr(sub_route, 'methods', 'N/A')}")

@app.on_event("shutdown")
def shutdown_event(): # Changed to synchronous
    print("Application shutdown...")
    # Close Redis connection
    # The SyncRedisClient doesn't have an explicit close on the global instance typically,
    # as it's managed by the Python process. If explicit close is needed, it should be added to SyncRedisClient
    # and called here. For now, assuming process exit handles it or connection pooling manages it.
    # If redis_client was an instance of SyncRedisClient directly (not just the internal client):
    # if isinstance(redis_client, SyncRedisClient): # This check is conceptual
    #     redis_client.close() # This would require redis_client to be the class instance
    # For the current setup where redis_client is the direct redis.Redis instance or None:
    if redis_client and hasattr(redis_client, 'close'):
         try:
             redis_client.close() # redis.Redis has a close method via connection_pool.disconnect()
             print("Redis connection pool disconnected.")
         except Exception as e:
             print(f"Error closing Redis connection: {e}")
    else:
        print("Redis client was not available or not closable.")

    # Stop the scheduler
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler shut down.")
    else:
        print("Scheduler was not running.")

# WebSocket endpoint
from app.websockets.router import router as ws_router
app.include_router(ws_router) # WebSocket endpoint at /ws

@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint."""
    # Check Redis health if critical
    redis_status = "ok" if redis_client and redis_client.ping() else "unavailable"
    return {
        "status": "ok", 
        "environment": settings.ENVIRONMENT, 
        "debug_mode": settings.DEBUG,
        "redis_status": redis_status
    }

@app.get("/metrics")
async def metrics():
    """Endpoint for Prometheus metrics."""
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

if __name__ == "__main__":
    import uvicorn
    # It's good practice to run the app instance directly, not the file path as string.
    uvicorn.run(app, host=settings.SERVER_HOST, port=settings.SERVER_PORT, reload=settings.DEBUG)