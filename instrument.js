// Register module aliases first (for config import)
require("module-alias/register");

const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const { PrometheusExporter } = require("@opentelemetry/exporter-prometheus");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const config = require("@config");

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  metricReader: new PrometheusExporter({
    port: config.otel.metricsPort,
    endpoint: config.otel.metricsEndpoint,
  }),
  traceExporter: new OTLPTraceExporter({
    url: config.otel.tracesEndpoint,
  }),
  serviceName: config.otel.serviceName,
  serviceVersion: config.otel.serviceVersion,
});

sdk.start();
