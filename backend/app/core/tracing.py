from typing import Optional
import os


_tracer_provider: Optional[object] = None


def configure_tracing(service_name: str = "api-test-backend"):
    """Configure OpenTelemetry tracing with OTLP export if OTEL_EXPORTER_OTLP_ENDPOINT set."""
    global _tracer_provider
    if _tracer_provider is not None:
        return _tracer_provider

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.sdk.resources import Resource, SERVICE_NAME
    except ImportError:
        # OpenTelemetry not installed; no-op
        return None

    # Create resource with service name
    resource = Resource(attributes={SERVICE_NAME: service_name})

    # Create tracer provider
    _tracer_provider = TracerProvider(resource=resource)

    # Add OTLP exporter if endpoint configured
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if otlp_endpoint:
        try:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
            otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
            _tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
        except Exception:
            # fallback if OTLP not available
            pass

    # Set global tracer provider
    trace.set_tracer_provider(_tracer_provider)
    return _tracer_provider


def instrument_app(app):
    """Instrument FastAPI app with OpenTelemetry."""
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        FastAPIInstrumentor.instrument_app(app)
    except Exception:
        pass


def instrument_sqlalchemy(engine):
    """Instrument SQLAlchemy engine with OpenTelemetry."""
    try:
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
        SQLAlchemyInstrumentor().instrument(engine=engine)
    except Exception:
        pass
