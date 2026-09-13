import React, { useState, useMemo } from "react";

const booksData = [
  { id: 1, title: "Mathematics Grade 6", author: "R.S. Aggarwal", category: "Math", price: 350, stock: 25 },
  { id: 2, title: "Science Essentials 7", author: "NCERT", category: "Science", price: 290, stock: 18 },
  { id: 3, title: "English Grammar Plus", author: "Wren & Martin", category: "English", price: 320, stock: 10 },
  { id: 4, title: "Social Studies Guide", author: "NCERT", category: "Social Science", price: 260, stock: 30 },
  { id: 5, title: "Physics Fundamentals 8", author: "H.C. Verma", category: "Science", price: 340, stock: 22 },
  { id: 6, title: "Advanced Chemistry 9", author: "Pradeep Publications", category: "Science", price: 390, stock: 14 },
  { id: 7, title: "Perfect Maths Practice 7", author: "R.D. Sharma", category: "Math", price: 310, stock: 8 },
  { id: 8, title: "World History for Beginners", author: "David Thomas", category: "Social Science", price: 280, stock: 19 },
  { id: 9, title: "Atlas for Students", author: "Oxford", category: "Geography", price: 450, stock: 12 },
  { id: 10, title: "Environmental Studies 5", author: "NCERT", category: "EVS", price: 210, stock: 28 },
  { id: 11, title: "Hindi Vyakaran Saral 6", author: "Lakshmi Publications", category: "Hindi", price: 180, stock: 26 },
  { id: 12, title: "Marigold English Reader 4", author: "NCERT", category: "English", price: 240, stock: 15 },
  { id: 13, title: "Computer Basics for Kids", author: "TechBooks", category: "Computer", price: 300, stock: 20 },
  { id: 14, title: "Biology Life Processes 9", author: "NCERT", category: "Biology", price: 360, stock: 11 },
  { id: 15, title: "Algebra & Geometry 10", author: "R.S. Aggarwal", category: "Math", price: 410, stock: 9 },
  { id: 16, title: "Civics – Understanding Citizenship", author: "Pearson", category: "Social Science", price: 330, stock: 13 },
  { id: 17, title: "Indian Economy Basics", author: "Ramesh Singh", category: "Economics", price: 380, stock: 7 },
  { id: 18, title: "GK Smart Kids 6", author: "Dreamland", category: "General Knowledge", price: 150, stock: 34 },
  { id: 19, title: "Moral Values & Ethics 5", author: "Evergreen", category: "Moral Science", price: 200, stock: 21 },
  { id: 20, title: "English Literature Classics", author: "Scholastic", category: "English", price: 450, stock: 6 },
  { id: 21, title: "Reasoning Skills Workbook", author: "Education Hub", category: "Reasoning", price: 260, stock: 16 },
  { id: 22, title: "Geography Earth & Space 8", author: "NCERT", category: "Geography", price: 310, stock: 18 },
  { id: 23, title: "Python for Beginners", author: "CodeLab", category: "Computer", price: 500, stock: 5 },
  { id: 24, title: "Storybook – Jungle Adventures", author: "Asha Malhotra", category: "Stories", price: 190, stock: 29 },
];


function getStockBadge(stock) {
  if (stock <= 8) {
    return {
      text: `${stock} in stock`,
      className: "bg-red-50 text-red-700",
    };
  }
  if (stock <= 15) {
    return {
      text: `${stock} in stock`,
      className: "bg-yellow-50 text-yellow-700",
    };
  }
  return {
    text: `${stock} in stock`,
    className: "bg-green-50 text-green-700",
  };
}

function Test() {
  const [search, setSearch] = useState("");

  const filteredBooks = useMemo(() => {
    const q = search?.toLowerCase();
    return booksData.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
    );
  }, [search]);

  const totalBooks = booksData.length;
  const lowStockCount = booksData.filter((b) => b.stock <= 8).length;
  const mediumStockCount = booksData.filter((b) => b.stock > 8 && b.stock <= 15).length;
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="w-full bg-blue-950 border-b border-blue-900/60 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-semibold">
              SB
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-white">
                SchoolBook Admin
              </h1>
              <p className="text-xs text-blue-200">
                Manage books, users, and inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:inline-flex items-center rounded-full border border-blue-700 px-3 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-800/60 transition">
              View Storefront
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-sm text-blue-100 font-medium">
                Admin
              </span>
              <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center border border-blue-400 text-white text-sm font-semibold">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:block w-64 shrink-0 border-r border-gray-200 bg-white/90 backdrop-blur-sm p-4 overflow-y-auto">
          <nav className="space-y-1 text-sm">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs">
                D
              </span>
              Dashboard
            </button>

            <p className="px-3 pt-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Management
            </p>

            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
              <span className="flex items-center gap-3">
                <span className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
                  B
                </span>
                Books
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {totalBooks}
              </span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
              <span className="flex items-center gap-3">
                <span className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                  U
                </span>
                Users
              </span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-800 hover:bg-gray-50 rounded-lg">
              <span className="flex items-center gap-3">
                <span className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
                  S
                </span>
                Settings
              </span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className="flex-1 space-y-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Books
                </h2>
                <p className="text-sm text-gray-500">
                  Search, sort, and manage your schoolbook inventory.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-gray-500">
                      Total Books
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {totalBooks}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-gray-500">
                      Low Stock (≤ 8)
                    </p>
                    <p className="mt-1 text-xl font-semibold text-rose-600">
                      {lowStockCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-gray-500">
                      Medium Stock (9–15)
                    </p>
                    <p className="mt-1 text-xl font-semibold text-amber-600">
                      {mediumStockCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:w-80 flex flex-col gap-3">
                <div className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, author, category..."
                    className="w-full text-sm focus:outline-none"
                  />
                </div>
                <button className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm">
                  + Add Book
                </button>
              </div>
            </div>

            {/* TABLE CARD */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {filteredBooks.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {booksData.length}
                  </span>{" "}
                  books
                </span>
                <span className="hidden sm:inline">
                  Tip: Use search to quickly filter by subject or author.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Author
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Price (₹)
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => {
                      const badge = getStockBadge(book.stock);
                      return (
                        <tr
                          key={book.id}
                          className="border-t border-gray-100 hover:bg-gray-50/60"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-medium max-w-xs">
                            <div className="flex flex-col">
                              <span className="truncate">{book.title}</span>
                              <span className="text-xs text-gray-400">
                                ID: #{book.id.toString().padStart(3, "0")}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {book.author}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                              {book.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {book.price}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-blue-600 hover:underline mr-3 text-xs sm:text-sm">
                              Edit
                            </button>
                            <button className="text-red-600 hover:underline text-xs sm:text-sm">
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredBooks.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          No books found. Try a different search keyword.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* FOOTER / FAKE PAGINATION */}
              <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
                <span>Rows per page: 10</span>
                <div className="flex items-center gap-3">
                  <button className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
                    Prev
                  </button>
                  <span>
                    Page <span className="font-semibold text-gray-700">1</span>{" "}
                    of 1
                  </span>
                  <button className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Test
