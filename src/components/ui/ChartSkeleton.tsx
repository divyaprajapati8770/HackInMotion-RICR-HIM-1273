import { Card, CardBody, CardHeader } from "@/components/ui/Card";

/**
 * Fallback for dynamically-imported chart components. Recharts (~90kB+ of
 * the shared dashboard/forecasts bundle) is loaded on demand rather than
 * bundled into the route's main chunk — this skeleton fills the same
 * footprint so there's no layout shift while that chunk streams in.
 */
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
      </CardHeader>
      <CardBody>
        <div className={`w-full ${height} rounded-lg bg-slate-50 animate-pulse`} />
      </CardBody>
    </Card>
  );
}
