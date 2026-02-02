"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, Search } from "lucide-react";
import { isAdmin } from "@/lib/roles";

interface AgentRow {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  agent_type: string;
  slug: string;
  email: string | null;
  phone: string | null;
  status: string;
  profile_image: string | null;
  createdAt: string;
}

export default function AdminAgentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated" && session?.user) {
      if (!isAdmin(session.user.role)) {
        router.push("/dashboard");
        return;
      }
      fetchAgents();
    }
  }, [status, session, router, page, searchTerm, statusFilter, typeFilter]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { agentType: typeFilter }),
      });
      const res = await fetch(`/api/admin/agents?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch agents");
      }
      const data = await res.json();
      setAgents(data.agents ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e) {
      console.error(e);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  if (status !== "authenticated" || !session?.user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Manage agents. Only admins can access this section.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/agents/new" className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Agent
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, job title..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No agents found.{" "}
              <Link
                href="/dashboard/admin/agents/new"
                className="text-primary hover:underline font-medium"
              >
                Add your first agent
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Job title</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Slug</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{agent.full_name}</td>
                        <td className="p-3 text-muted-foreground">{agent.job_title}</td>
                        <td className="p-3">{agent.agent_type}</td>
                        <td className="p-3">
                          <span
                            className={
                              agent.status === "ACTIVE"
                                ? "text-green-600 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {agent.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs">{agent.slug}</td>
                        <td className="p-3 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/admin/agents/${agent.slug}/edit`}>
                              <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden />
                              Edit
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/our-agents/${agent.slug}`} target="_blank">
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
