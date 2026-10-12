import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { startAuthFlow } from "./lib/native-auth";
import { Capacitor } from "@capacitor/core";
import { getNativeSessionToken } from "./lib/native-secure-storage";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { useServiceWorker } from "./hooks/useServiceWorker";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// The app does not use cross-app advertising tracking, so it intentionally does not request ATT permission.

function openNotificationDestination(data: Record<string, unknown> | undefined) {
  if (typeof window === "undefined") return;
  const trackingCode = typeof data?.trackingCode === "string" ? data.trackingCode : undefined;
  const role = typeof data?.role === "string" ? data.role : undefined;
  if (trackingCode) {
    window.location.assign(`/track?code=${encodeURIComponent(trackingCode)}`);
  } else if (role === "courier") {
    window.location.assign("/courier/dashboard");
  }
}

if (Capacitor.isNativePlatform()) {
  void LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
    openNotificationDestination(notification.extra as Record<string, unknown> | undefined);
  });
  void PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
    openNotificationDestination(notification.data as Record<string, unknown> | undefined);
  });
}

// Register service worker for offline support and caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('[SW] Registration failed:', err);
  });
}

// Lazy load App component for faster initial load
const App = lazy(() => import("./App"));

// Optimize QueryClient settings for faster startup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Native builds bundle the web UI locally, so API calls must target the
// hosted Mzansi Couriers backend rather than the capacitor:// origin.
const hostedBackendUrl = (import.meta.env.VITE_BACKEND_URL ?? "https://mzansicourier-nsebzqbt.manus.space").replace(/\/$/, "");
const trpcUrl = Capacitor.isNativePlatform() ? `${hostedBackendUrl}/api/trpc` : "/api/trpc";

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  void startAuthFlow();
};

// Subscribe to query cache errors
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

// Subscribe to mutation cache errors
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

// Create tRPC client with optimized settings
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      maxURLLength: 2083,
      async fetch(input, init) {
        const nativeSessionToken = await getNativeSessionToken();
        const headers = new Headers(init?.headers);
        if (nativeSessionToken) headers.set("Authorization", `Bearer ${nativeSessionToken}`);
        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});

// Loading fallback component
const LoadingFallback = () => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f5f5f5",
  }}>
    <div style={{
      fontSize: "18px",
      color: "#666",
    }}>Loading...</div>
  </div>
);

// Get root element with fallback
const rootElement = document.getElementById("root");
if (!rootElement) {
  // Create root element if it doesn't exist (fallback for iOS)
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </QueryClientProvider>
    </trpc.Provider>
  </ErrorBoundary>
);
