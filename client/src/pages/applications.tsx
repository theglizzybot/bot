import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, User, Calendar } from "lucide-react";
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
    case "New":
      return "bg-blue-500 text-white";
    case "Pending":
      return "bg-yellow-500 text-white";
    case "Accepted":
      return "bg-green-500 text-white";
    case "Rejected":
      return "bg-red-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Applications() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const filteredApplications =
    applications?.filter((app) =>
      selectedCategory === "All"
        ? true
        : app.category.includes(selectedCategory),
    ) || [];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Applications</h1>
          <p className="text-sm text-muted-foreground">
            Review and manage server applications
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                {filteredApplications.length} applications found
              </CardDescription>
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Admin">Admin</TabsTrigger>
                <TabsTrigger value="Member">Member</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedApplication(app)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-2 mb-1">
                        <span className="font-medium">{app.discordName}</span>
                        <Badge variant="outline">{app.category}</Badge>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />{" "}
                        {new Date(app.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="ghost">View</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedApplication}
        onOpenChange={() => setSelectedApplication(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Submitted by {selectedApplication?.discordName}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">User ID</p>
                  <p className="font-mono">{selectedApplication.discordId}</p>
                </div>
                <div>
                  <p className="font-semibold">Category</p>
                  <Badge>{selectedApplication.category}</Badge>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {selectedApplication.content}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
