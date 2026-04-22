import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/api";

interface PropertiesViewProps {
  properties: Property[];
}

export function PropertiesView({ properties }: PropertiesViewProps) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-4 text-sm text-muted-foreground">
        {properties.length} properties in the knowledge base. This is the data
        the retrieval layer is indexing.
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {properties.map((p) => (
          <Card key={p.property_id}>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="font-mono">{p.property_id}</CardTitle>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.address}
                </div>
              </div>
              <Badge variant="secondary">built {p.year_built}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  appraised
                </span>
                <span className="font-semibold">
                  ${p.appraised_value.toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground">{p.text}</p>
              {p.comps?.length ? (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    comps
                  </div>
                  <ul className="text-xs">
                    {p.comps.map((c) => (
                      <li key={c.address} className="flex justify-between">
                        <span className="truncate">{c.address}</span>
                        <span className="font-mono text-muted-foreground">
                          ${c.value.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
