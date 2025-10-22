import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, User, Calendar, Filter } from "lucide-react";
import type { Application } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Neu":
      return "bg-chart-2 text-white";
    case "In Bearbeitung":
      return "bg-chart-4 text-white";
    case "Angenommen":
      return "bg-status-online text-white";
    case "Abgelehnt":
      return "bg-status-busy text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Applications() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const filteredApplications = applications?.filter((app) => {
    if (selectedCategory === "Alle") return true;
    return app.category === selectedCategory;
  }) || [];

  const formatDate = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Bewerbungen</h1>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie alle eingehenden Bewerbungen für den Server
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Bewerbungsübersicht</CardTitle>
                <CardDescription>
                  {filteredApplications.length} {selectedCategory === "Alle" ? "Bewerbungen gesamt" : `${selectedCategory}en`}
                </CardDescription>
              </div>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList>
                  <TabsTrigger value="Alle" data-testid="tab-alle">
                    Alle
                  </TabsTrigger>
                  <TabsTrigger value="Admin-Bewerbung" data-testid="tab-admin">
                    Admin
                  </TabsTrigger>
                  <TabsTrigger value="Member-Bewerbung" data-testid="tab-member">
                    Member
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {selectedCategory === "Alle"
                    ? "Noch keine Bewerbungen eingegangen."
                    : `Keine ${selectedCategory}en gefunden.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 p-4 rounded-md border border-border hover-elevate cursor-pointer"
                      onClick={() => setSelectedApplication(app)}
                      data-testid={`application-${app.id}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground" data-testid={`text-discord-name-${app.id}`}>
                            {app.discordName}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            data-testid={`badge-category-${app.id}`}
                          >
                            {app.category}
                          </Badge>
                          <Badge
                            className={`text-xs ${getStatusColor(app.status)}`}
                            data-testid={`badge-status-${app.id}`}
                          >
                            {app.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span data-testid={`text-timestamp-${app.id}`}>
                            {formatDate(app.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplication(app);
                        }}
                        data-testid={`button-view-${app.id}`}
                      >
                        Ansehen
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Bewerbungsdetails</DialogTitle>
            <DialogDescription>
              Bewerbung von {selectedApplication?.discordName}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Discord Name</p>
                  <p className="text-sm text-muted-foreground">{selectedApplication.discordName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Discord ID</p>
                  <p className="text-sm text-muted-foreground font-mono">{selectedApplication.discordId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Kategorie</p>
                  <Badge variant="secondary">{selectedApplication.category}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Status</p>
                  <Badge className={getStatusColor(selectedApplication.status)}>
                    {selectedApplication.status}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-foreground mb-1">Eingegangen am</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedApplication.timestamp)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Bewerbungstext</p>
                <div className="p-4 rounded-md bg-muted/50 text-sm text-foreground whitespace-pre-wrap">
                  {selectedApplication.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
