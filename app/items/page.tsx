"use client";

import { Navbar, Sidebar } from "@/components";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { MenuItem, MenuCategory } from "@/types";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type SortKey = "name" | "price" | "orders" | "revenue";
type SortDirection = "asc" | "desc";

export default function ItemsPage() {
  const router = useRouter();
  const { restaurantId } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"1w" | "1m">("1m");

  const fetchMenuItems = async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        restaurant_id: restaurantId,
        time_range: timeRange,
      });
      const response = await fetch(
        `${API_BASE_URL}/api/analytics/menu-items?${params}`,
      );
      if (!response.ok)
        throw new Error(`Failed to fetch menu items: ${response.statusText}`);
      const data = await response.json();
      setItems(data.items);
      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load menu items",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [timeRange, restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleAvailable = async (itemId: string) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, available: !item.available } : item,
      ),
    );
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedItems = [...items]
    .filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.toLowerCase().localeCompare((bVal as string).toLowerCase())
          : (bVal as string).toLowerCase().localeCompare(aVal.toLowerCase());
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  const handleSignOut = () => console.log("Sign out clicked");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar onSignOut={handleSignOut} />

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Menu Items
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track performance across all your menu items
              </p>
            </div>
            {/* Time Range Filter */}
            <div className="flex gap-2">
              {(["1w", "1m"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === range
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-400"
                  }`}
                >
                  {range === "1w" ? "7D" : "30D"}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={fetchMenuItems}
                className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Items Table */}
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Filters Row */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Item
                        {sortKey === "name" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </span>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSort("price")}
                        className="flex items-center gap-2 ml-auto text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Price
                        {sortKey === "price" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSort("orders")}
                        className="flex items-center gap-2 ml-auto text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Orders
                        {sortKey === "orders" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSort("revenue")}
                        className="flex items-center gap-2 ml-auto text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Revenue
                        {sortKey === "revenue" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Text-to-Order
                      </span>
                    </th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading ? (
                    // Skeleton rows
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-40" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-20" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-16 ml-auto" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-12 ml-auto" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-20 ml-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-11 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse mx-auto" />
                        </td>
                        <td className="px-6 py-4" />
                      </tr>
                    ))
                  ) : filteredAndSortedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <svg
                            className="h-12 w-12 mb-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm font-medium">No items found</p>
                          <p className="text-sm">
                            Try adjusting your search or category filter
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/items/${item.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {item.category ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.price)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-900 dark:text-white">
                            {item.orders.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.revenue)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAvailable(item.id);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                item.available
                                  ? "bg-blue-600"
                                  : "bg-gray-200 dark:bg-gray-700"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.available ? "translate-x-6" : "translate-x-1"}`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {filteredAndSortedItems.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {items.length}
                </span>{" "}
                items
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
