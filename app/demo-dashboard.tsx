"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ConvexProvider,
  ConvexReactClient,
  useMutation,
  useQuery,
} from "convex/react";
import { makeFunctionReference } from "convex/server";
import {
  Activity,
  CheckCircle2,
  DatabaseZap,
  ExternalLink,
  RadioTower,
  RefreshCw,
  Server,
  TriangleAlert,
} from "lucide-react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const appHostname =
  process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "coolify-convex-demo.wsconsult.work";
const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "local";

type CheckRecord = {
  _id: string;
  _creationTime: number;
  source: string;
  url: string;
  userAgent?: string;
  clientTime: number;
  buildId: string;
};

type Snapshot = {
  checkCount: number;
  recentChecks: CheckRecord[];
  serverNow: number;
};

type CheckInArgs = {
  source: string;
  url: string;
  userAgent?: string;
  clientTime: number;
  buildId: string;
};

type CheckInResult = {
  checkCount: number;
  recordedAt: number;
};

const snapshotRef = makeFunctionReference<"query", Record<string, never>, Snapshot>(
  "status:snapshot",
);
const checkInRef = makeFunctionReference<"mutation", CheckInArgs, CheckInResult>(
  "status:checkIn",
);

export function DemoDashboard() {
  if (!convexUrl) {
    return <ConfigurationMissing />;
  }

  const client = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexProvider client={client}>
      <LiveState convexUrl={convexUrl} />
    </ConvexProvider>
  );
}

function LiveState({ convexUrl }: { convexUrl: string }) {
  const snapshot = useQuery(snapshotRef);
  const checkIn = useMutation(checkInRef);
  const [lastWrite, setLastWrite] = useState<string>("waiting");
  const [writeError, setWriteError] = useState<string | null>(null);

  const recordCheck = async (source: string) => {
    setWriteError(null);
    try {
      const result = await checkIn({
        source,
        url: window.location.href,
        userAgent: navigator.userAgent,
        clientTime: Date.now(),
        buildId,
      });
      setLastWrite(formatClock(result.recordedAt));
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    void recordCheck("browser-load");
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">
            <RadioTower size={16} aria-hidden="true" />
            WSConsult deployment proof
          </p>
          <h1>Coolify Convex Demo</h1>
          <p className="lede">
            A small Next.js app that builds through Coolify, connects from the
            browser to its own Convex backend, writes live state, and reads it
            back over the public hostname.
          </p>
        </div>
        <div className="live-badge" aria-label="Live deployment status">
          <span className={snapshot ? "pulse ready" : "pulse"} />
          {snapshot ? "Live Convex read" : "Connecting"}
        </div>
      </section>

      <section className="metrics" aria-label="Deployment checks">
        <Metric
          icon={<Server size={20} aria-hidden="true" />}
          label="Public app host"
          value={appHostname}
        />
        <Metric
          icon={<DatabaseZap size={20} aria-hidden="true" />}
          label="Convex client endpoint"
          value={new URL(convexUrl).hostname}
        />
        <Metric
          icon={<Activity size={20} aria-hidden="true" />}
          label="Browser writes"
          value={snapshot ? snapshot.checkCount.toLocaleString() : "..."}
        />
      </section>

      <section className="workspace">
        <div className="panel status-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Round trip</p>
              <h2>Live backend state</h2>
            </div>
            <button type="button" onClick={() => void recordCheck("manual")}>
              <RefreshCw size={16} aria-hidden="true" />
              Ping Convex
            </button>
          </div>

          <div className="proof-grid">
            <ProofItem
              ready={Boolean(snapshot)}
              label="Convex query"
              detail={
                snapshot
                  ? `server time ${formatClock(snapshot.serverNow)}`
                  : "waiting for snapshot"
              }
            />
            <ProofItem
              ready={lastWrite !== "waiting" && !writeError}
              label="Convex mutation"
              detail={writeError ?? `last write ${lastWrite}`}
              danger={Boolean(writeError)}
            />
            <ProofItem
              ready={
                typeof window !== "undefined" &&
                window.location.hostname === appHostname
              }
              label="Public hostname"
              detail={
                typeof window !== "undefined"
                  ? window.location.hostname || "local preview"
                  : appHostname
              }
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading compact">
            <div>
              <p className="section-kicker">Recent activity</p>
              <h2>Browser check-ins</h2>
            </div>
            <a href={convexUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} aria-hidden="true" />
              Convex
            </a>
          </div>
          <ol className="activity-list">
            {snapshot?.recentChecks.length ? (
              snapshot.recentChecks.map((check) => (
                <li key={check._id}>
                  <span className="activity-dot" />
                  <div>
                    <strong>{check.source}</strong>
                    <span>
                      {formatClock(check._creationTime)} from{" "}
                      {new URL(check.url).hostname || "local"}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="empty-state">No check-ins recorded yet.</li>
            )}
          </ol>
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="metric">
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function ProofItem({
  ready,
  label,
  detail,
  danger = false,
}: {
  ready: boolean;
  label: string;
  detail: string;
  danger?: boolean;
}) {
  const Icon = danger ? TriangleAlert : CheckCircle2;
  return (
    <div className={ready && !danger ? "proof-item ready" : "proof-item"}>
      <Icon size={18} aria-hidden="true" />
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

function ConfigurationMissing() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">
            <TriangleAlert size={16} aria-hidden="true" />
            Missing configuration
          </p>
          <h1>Convex URL is not set</h1>
          <p className="lede">
            Set <code>NEXT_PUBLIC_CONVEX_URL</code> in the Coolify build
            environment so the browser bundle can connect to the per-app Convex
            backend.
          </p>
        </div>
      </section>
    </main>
  );
}

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}
