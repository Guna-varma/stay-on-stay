import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, FileText, Moon, Plane } from "lucide-react";
import { toast } from "sonner";

const actions = [
  {
    id: "frro",
    title: "FRRO / C-form export",
    description: "Guest registration bundle for immigration filing.",
    icon: Plane,
  },
  {
    id: "nightly",
    title: "Nightly occupancy",
    description: "CSV of in-house guests by property.",
    icon: Moon,
  },
  {
    id: "revenue",
    title: "Front-desk revenue",
    description: "Incidental charges and balance settlements.",
    icon: FileSpreadsheet,
  },
  {
    id: "audit",
    title: "Audit log excerpt",
    description: "Passport views and overrides (last 7 days).",
    icon: FileText,
  },
] as const;

export function ReportsPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        One-click exports (demo). Wire to Edge Functions + signed URLs for production.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((a) => (
          <Card key={a.id} className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <a.icon className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{a.title}</CardTitle>
              </div>
              <CardDescription className="text-xs">{a.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-lg"
                onClick={() => toast.success(`Prepared ${a.title} (demo)`)}
              >
                Generate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
