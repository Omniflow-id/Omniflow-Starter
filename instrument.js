const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  metricReader: new PrometheusExporter({
    port: process.env.OTEL_METRICS_PORT || 9092,
    endpoint: process.env.OTEL_METRICS_ENDPOINT || '/metrics'
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  serviceName: process.env.OTEL_SERVICE_NAME || 'omniflow-starter',
  serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
});

sdk.start();