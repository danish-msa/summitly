"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PreConstructionPropertyCardV3 from "@/components/PreCon/PropertyCards/PreConstructionPropertyCardV3";
import type { PreConstructionProperty } from "@/components/PreCon/PropertyCards/types";
import {
  convertApiV1ToPreConProperty,
  type ApiV1Project,
} from "@/components/PreCon/PreConstructionBasePage/utils";
import { PreConstructionCardSkeleton } from "@/components/skeletons";

const PAGE_SIZE = 20;

const AssignmentProjectsList: React.FC = () => {
  const searchParams = useSearchParams();
  const city = searchParams?.get("city") ?? "";

  const [projects, setProjects] = useState<PreConstructionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [_page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const isLoadingRef = useRef(false);

  const fetchProjects = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const { api } = await import("@/lib/api/client");
        const params: Record<string, string | number> = {
          limit: PAGE_SIZE,
          page: pageNum,
          status: "assignments",
        };
        if (city) params.city = city;

        const response = await api.get<{
          projects: ApiV1Project[];
          pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>("/pre-con-projects", {
          params,
        });

        if (response.success && response.data) {
          const converted = (response.data.projects || []).map((p) => {
            const prop = convertApiV1ToPreConProperty(p);
            return {
              ...prop,
              status: "selling" as const,
            };
          });

          if (append) {
            setProjects((prev) => [...prev, ...converted]);
          } else {
            setProjects(converted);
          }

          if (response.data.pagination) {
            const { page: currentPage, totalPages, total } =
              response.data.pagination;
            setTotalProjects(total);
            setHasMore(currentPage < totalPages);
          } else {
            setHasMore(converted.length === PAGE_SIZE);
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("[AssignmentProjectsList] Error fetching:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [city]
  );

  useEffect(() => {
    setProjects([]);
    setPage(1);
    setHasMore(true);
    fetchProjects(1, false);
  }, [city, fetchProjects]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 1000 &&
        !isLoadingRef.current &&
        !loadingMore &&
        hasMore &&
        !loading
      ) {
        setPage((prev) => {
          const next = prev + 1;
          fetchProjects(next, true);
          return next;
        });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore, loading, fetchProjects]);

  if (loading) {
    return (
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <PreConstructionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24"
      aria-labelledby="assignment-projects-heading"
    >
      <h2
        id="assignment-projects-heading"
        className="sr-only"
      >
        Assignment projects
      </h2>

      {projects.length > 0 ? (
        <>
          <p className="text-zinc-600 text-sm sm:text-base mb-6">
            {totalProjects > 0
              ? `${projects.length} of ${totalProjects} assignment ${totalProjects === 1 ? "project" : "projects"}`
              : `${projects.length} assignment ${projects.length === 1 ? "project" : "projects"}`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/pre-con/${project.id}`}
                className="block transition-all hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 rounded-xl"
              >
                <PreConstructionPropertyCardV3 property={project} />
              </Link>
            ))}
          </div>
          {loadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {[...Array(4)].map((_, i) => (
                <PreConstructionCardSkeleton key={`load-${i}`} />
              ))}
            </div>
          )}
          {!hasMore && projects.length > 0 && (
            <p className="text-center text-zinc-500 text-sm py-8">
              You&apos;ve reached the end of the list.
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-zinc-600 text-lg">
            No assignment projects are available at the moment.
          </p>
          <Link
            href="/pre-con/projects"
            className="inline-block mt-4 text-secondary font-medium hover:underline"
          >
            Browse all pre-construction projects
          </Link>
        </div>
      )}
    </section>
  );
};

export default AssignmentProjectsList;
