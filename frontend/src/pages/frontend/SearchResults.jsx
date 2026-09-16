import React from "react";
import { useLoaderData, useSearchParams, Link } from "react-router-dom";

export default function SearchResults() {
  const { query, data: books, pagination } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Search results for “{query}”
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {pagination?.total ?? 0} result{pagination?.total === 1 ? "" : "s"}
      </p>

      {books.length === 0 ? (
        <p className="text-gray-500">No products matched your search.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {books.map((b) => (
            <Link
              key={b._id || b.id}
              to={`/products/${b.handle || b._id}`}
              className="block border border-gray-200 rounded-xl p-3 hover:shadow-md transition"
            >
              <img
                src={b.images?.[0]?.url || "/placeholder-image.jpg"}
                alt={b.title}
                className="w-full aspect-square object-contain"
              />
              <p className="mt-2 text-sm font-medium line-clamp-2">{b.title}</p>
              {b.minPrice != null && (
                <p className="text-xs text-gray-600 mt-1">From ₹{b.minPrice}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() =>
              setSearchParams({ q: query, page: page - 1 })
            }
            className="px-3 py-1.5 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() =>
              setSearchParams({ q: query, page: page + 1 })
            }
            className="px-3 py-1.5 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}