"use client";

import { useState, useEffect } from "react";
import { Navbar, Sidebar } from "@/components";
import { ItemAnalytics } from "@/components/ItemAnalytics";
import { useRouter, useParams } from "next/navigation";
import { MenuItem } from "@/types";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ItemDetailPage() {
  const router = useRouter();
  const { restaurantId } = useAuth();
  const params = useParams();
  const itemId = params?.id as string;

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    const fetchItem = async () => {
      try {
        const params = new URLSearchParams({
          restaurant_id: restaurantId,
          time_range: "1m",
        });
        const response = await fetch(
          `${API_BASE_URL}/api/analytics/menu-items?${params}`,
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        const found = data.items.find((i: MenuItem) => i.id === itemId);
        if (found) {
          setItem(found);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId, restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleAvailable = () => {
    if (item) setItem({ ...item, available: !item.available });
  };

  const handleSignOut = () => console.log("Sign out clicked");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
        <Sidebar />
        <div className="lg:pl-64">
          <Navbar onSignOut={handleSignOut} />
          <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {/* Back Button skeleton */}
            <div className="mb-6 h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            {/* Header skeleton */}
            <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
              <div className="space-y-3">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-7 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
        <Sidebar />
        <div className="lg:pl-64">
          <Navbar onSignOut={handleSignOut} />
          <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Item not found
              </h1>
              <button
                onClick={() => router.push("/items")}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to Items
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar onSignOut={handleSignOut} />

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/items")}
            className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back to Items</span>
          </button>

          {/* Item Header */}
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </h1>
                  {item.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(item.price)}
                  </span>
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.orders.toLocaleString()}
                      </span>{" "}
                      orders
                    </span>
                    <span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.revenue)}
                      </span>{" "}
                      revenue (30d)
                    </span>
                  </div>
                </div>
              </div>

              {/* Text-to-Order Toggle */}
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Text-to-Order
                </div>
                <button
                  onClick={handleToggleAvailable}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    item.available
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${item.available ? "translate-x-7" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <ItemAnalytics itemId={itemId} itemName={item.name} />
        </main>
      </div>
    </div>
  );
}
