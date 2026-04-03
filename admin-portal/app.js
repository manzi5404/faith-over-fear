const { useEffect, useMemo, useState } = React;

const BASE_URL = "http://localhost:5000";

const tokenStore = {
  get() {
    return localStorage.getItem("ff_admin_token");
  },
  set(token) {
    localStorage.setItem("ff_admin_token", token);
  },
  clear() {
    localStorage.removeItem("ff_admin_token");
  }
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PageShell = ({ children }) => (
  <div className="min-h-screen">
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">F&gt;F Admin</h1>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <a href="#/dashboard" className="hover:text-white">Dashboard</a>
          <button
            onClick={() => {
              tokenStore.clear();
              window.location.hash = "#/login";
            }}
            className="rounded bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-200"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/api/admin/login", { email, password });
      const token = response.data?.token || response.data?.accessToken;
      if (!token) {
        throw new Error("Token missing from response");
      }
      tokenStore.set(token);
      window.location.hash = "#/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      >
        <h2 className="mb-6 text-2xl font-semibold">Admin Login</h2>
        <div className="space-y-4">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
};

const useFetch = (fetcher, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetcher();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, deps);

  return { data, loading, error, reload: run };
};

const ProductsSection = ({ onToast }) => {
  const { data, loading, error, reload } = useFetch(() => api.get("/api/products"), []);
  const [form, setForm] = useState({ name: "", price: "", sizes: "", images: "", isActive: true });
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm({ name: "", price: "", sizes: "", images: "", isActive: true });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      price: Number(form.price),
      sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
      images: form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
      isActive: !!form.isActive
    };
    try {
      if (editingId) {
        await api.put(`/api/admin/products/${editingId}`, payload);
        onToast("Product updated");
      } else {
        await api.post("/api/admin/products", payload);
        onToast("Product created");
      }
      resetForm();
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id || product.id);
    setForm({
      name: product.name || "",
      price: product.price || "",
      sizes: (product.sizes || []).join(", "),
      images: (product.images || []).join(", "),
      isActive: product.isActive !== false
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/products/${id}`);
      onToast("Product deleted");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Delete failed");
    }
  };

  const toggleActive = async (product) => {
    try {
      await api.put(`/api/admin/products/${product._id || product.id}`, { isActive: !product.isActive });
      reload();
    } catch (err) {
      onToast("Toggle failed");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Products</h3>
        <button onClick={resetForm} className="text-xs uppercase text-slate-300">Clear</button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Price"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Sizes (S, M, L)"
          value={form.sizes}
          onChange={(event) => setForm({ ...form, sizes: event.target.value })}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Images (comma URLs)"
          value={form.images}
          onChange={(event) => setForm({ ...form, images: event.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Active
        </label>
        <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900">
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </form>
      {loading && <p className="mt-4 text-sm text-slate-400">Loading...</p>}
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(data || []).map((product) => (
          <div key={product._id || product.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-slate-400">${product.price}</p>
              </div>
              <span className={`text-xs ${product.isActive ? "text-emerald-400" : "text-rose-400"}`}>
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button onClick={() => handleEdit(product)} className="rounded bg-slate-800 px-2 py-1">Edit</button>
              <button onClick={() => toggleActive(product)} className="rounded bg-slate-800 px-2 py-1">
                Toggle
              </button>
              <button onClick={() => handleDelete(product._id || product.id)} className="rounded bg-rose-600 px-2 py-1">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const CollectionsSection = ({ onToast }) => {
  const { data, loading, error, reload } = useFetch(() => api.get("/api/admin/drops"), []);
  const [form, setForm] = useState({ name: "", description: "", status: "upcoming" });
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm({ name: "", description: "", status: "upcoming" });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      status: form.status
    };
    try {
      if (editingId) {
        await api.patch(`/api/admin/drops/${editingId}`, payload);
        onToast("Drop updated");
      } else {
        await api.post("/api/admin/drops", payload);
        onToast("Drop created");
      }
      resetForm();
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save drop");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      status: item.status || "upcoming"
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/drops/${id}`);
      onToast("Drop deleted");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Delete failed");
    }
  };

  const updateStatus = async (item, newStatus) => {
    try {
      await api.patch(`/api/admin/drops/${item._id || item.id}`, { status: newStatus });
      onToast(`Status updated to ${newStatus}`);
      reload();
    } catch (err) {
      onToast("Status update failed");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Drops / Collections Flow</h3>
        <button onClick={resetForm} className="text-xs uppercase text-slate-300">Clear</button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <select
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value })}
        >
          <option value="upcoming">Upcoming (Disabled)</option>
          <option value="reservation">Reservation (Reserve Now)</option>
          <option value="live">Live (MoMo Enabled)</option>
        </select>
        <textarea
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm md:col-span-2"
          placeholder="Description"
          rows="2"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 md:col-span-2">
          {editingId ? "Update Drop" : "Add Drop"}
        </button>
      </form>
      {loading && <p className="mt-4 text-sm text-slate-400">Loading...</p>}
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(data || []).map((item) => (
          <div key={item._id || item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                item.status === 'live' ? 'bg-emerald-500/10 text-emerald-400' :
                item.status === 'reservation' ? 'bg-blue-500/10 text-blue-400' :
                'bg-zinc-500/10 text-zinc-400'
              }`}>
                {item.status || 'upcoming'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button onClick={() => handleEdit(item)} className="rounded bg-slate-800 px-2 py-1">Edit</button>
              <div className="flex gap-1 border-l border-slate-800 pl-2 ml-1">
                <button 
                  onClick={() => updateStatus(item, 'upcoming')} 
                  className={`rounded px-2 py-1 ${item.status === 'upcoming' ? 'bg-zinc-700 text-white' : 'bg-slate-900 text-slate-500'}`}
                >Upc</button>
                <button 
                  onClick={() => updateStatus(item, 'reservation')} 
                  className={`rounded px-2 py-1 ${item.status === 'reservation' ? 'bg-zinc-700 text-white' : 'bg-slate-900 text-slate-500'}`}
                >Res</button>
                <button 
                  onClick={() => updateStatus(item, 'live')} 
                  className={`rounded px-2 py-1 ${item.status === 'live' ? 'bg-zinc-700 text-white' : 'bg-slate-900 text-slate-500'}`}
                >Live</button>
              </div>
              <button onClick={() => handleDelete(item._id || item.id)} className="ml-auto rounded bg-rose-600/20 text-rose-400 px-2 py-1 hover:bg-rose-600 hover:text-white transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const AnnouncementSection = ({ onToast }) => {
  const { data: announcement, loading, error, reload } = useFetch(() => api.get("/api/admin/announcement"), []);
  const [form, setForm] = useState({
    title: "Movement Update",
    message: "",
    isActive: true
  });

  useEffect(() => {
    if (announcement?.announcement) {
      setForm({
        title: announcement.announcement.title || "Movement Update",
        message: announcement.announcement.message || "",
        isActive: !!announcement.announcement.is_enabled
      });
    }
  }, [announcement]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      title: form.title,
      message: form.message,
      is_enabled: !!form.isActive
    };
    try {
      await api.put("/api/admin/announcement", payload);
      onToast("Announcement updated");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save announcement");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Announcement Bar</h3>
        <button onClick={reload} className="text-xs uppercase text-slate-300">Refresh</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Display Title</label>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="e.g. New Drop Coming"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Message Content</label>
          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Message visible to all users"
            rows="3"
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Show Announcement Bar
        </label>
        <button className="w-full rounded-lg bg-fof-accent text-white px-3 py-3 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
          Update Live Message
        </button>
      </form>
    </section>
  );
};

const SettingsSection = ({ onToast }) => {
  const { data, loading, error, reload } = useFetch(() => api.get("/api/settings"), []);
  const [form, setForm] = useState({
    purchasingDisabled: false,
    isRestocking: false,
    restockingMessage: ""
  });

  useEffect(() => {
    if (data) {
      setForm({
        purchasingDisabled: !!data.purchasingDisabled,
        isRestocking: !!data.isRestocking,
        restockingMessage: data.restockingMessage || ""
      });
    }
  }, [data]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.put("/api/admin/settings", form);
      onToast("Settings updated");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="mb-4 text-lg font-semibold">Store Settings</h3>
      {loading && <p className="text-sm text-slate-400">Loading...</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {!loading && (
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.purchasingDisabled}
              onChange={(event) => setForm({ ...form, purchasingDisabled: event.target.checked })}
            />
            Disable purchasing
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isRestocking}
              onChange={(event) => setForm({ ...form, isRestocking: event.target.checked })}
            />
            Restocking mode
          </label>
          <input
            className="md:col-span-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Restocking message"
            value={form.restockingMessage}
            onChange={(event) => setForm({ ...form, restockingMessage: event.target.value })}
          />
          <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900">
            Save Settings
          </button>
        </form>
      )}
    </section>
  );
};

const OrdersSection = ({ onToast }) => {
  const { data, loading, error, reload } = useFetch(() => api.get("/api/admin/orders"), []);
  const [filterMethod, setFilterMethod] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const orders = data?.orders || [];

  const filteredOrders = orders.filter((o) => {
    const statusMatch = filterStatus === "all" || o.status === filterStatus;
    const methodMatch = filterMethod === "all" || (o.payment_method || "reservation") === filterMethod;
    return statusMatch && methodMatch;
  });

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    contacted: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      onToast(`Order #${orderId} updated to ${newStatus}`);
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to update status");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    contacted: orders.filter((o) => o.status === "contacted").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Orders / Reservations</h3>
        <button onClick={reload} className="rounded bg-slate-800 px-3 py-1 text-xs uppercase text-slate-300 hover:bg-slate-700">
          Refresh
        </button>
      </div>

      {/* Filters Overlay */}
      <div className="mb-4 flex flex-wrap gap-6 items-center border-b border-slate-800 pb-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "contacted", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filterStatus === status
                  ? "bg-white text-slate-900"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {status} ({orders.filter(o => status === 'all' || o.status === status).length})
            </button>
          ))}
        </div>
        
        {/* Method Filter */}
        <div className="flex gap-2 border-l border-slate-800 pl-4">
           {["all", "momo", "reservation"].map((method) => (
            <button
              key={method}
              onClick={() => setFilterMethod(method)}
              className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                filterMethod === method
                  ? "bg-fof-accent text-white"
                  : "bg-slate-800 text-slate-500 hover:text-white"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading orders...</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}

      {/* Orders Table */}
      {!loading && filteredOrders.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">No orders found.</p>
      )}
      {!loading && filteredOrders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Size/Qty</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 pr-4 font-mono text-xs">#{order.id}</td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium">{order.customer_name || order.user_display_name || "Guest"}</p>
                        <p className="text-xs text-slate-500">{order.customer_email || order.user_display_email || ""}</p>
                        {order.customer_phone && (
                          <p className="text-xs text-slate-500">{order.customer_phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{order.product_name || `Product #${order.product_id}`}</td>
                    <td className="py-3 pr-4 text-xs text-slate-400">
                      {(order.size || "N/A")} / {order.quantity || 1}
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold">{parseFloat(order.total_price).toLocaleString()} FRW</td>
                    <td className="py-3 pr-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs capitalize">{order.payment_method || "reservation"}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColors[order.status] || "bg-slate-800 text-slate-400"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-500">{formatDate(order.created_at)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          {expandedId === order.id ? "Hide" : "Details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <td colSpan="9" className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Order ID</p>
                            <p className="font-mono">#{order.id}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Product ID</p>
                            <p className="font-mono">#{order.product_id}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Color</p>
                            <p>{order.color || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Drop ID</p>
                            <p className="font-mono">{order.drop_id ? `#${order.drop_id}` : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Created</p>
                            <p>{formatDate(order.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Updated</p>
                            <p>{formatDate(order.updated_at)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">User ID</p>
                            <p className="font-mono">{order.user_id ? `#${order.user_id}` : "Guest"}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide">Payment Method</p>
                            <p className="capitalize">{order.payment_method || "reservation"}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const Dashboard = () => {
  const [toast, setToast] = useState("");

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <PageShell>
      {toast && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {toast}
        </div>
      )}
      <div className="grid gap-6">
        <OrdersSection onToast={notify} />
        <ProductsSection onToast={notify} />
        <CollectionsSection onToast={notify} />
        <AnnouncementSection onToast={notify} />
        <SettingsSection onToast={notify} />
      </div>
    </PageShell>
  );
};

const App = () => {
  const [route, setRoute] = useState(window.location.hash || "#/login");
  const token = tokenStore.get();

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#/login");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (!token && route !== "#/login") {
    window.location.hash = "#/login";
    return null;
  }

  if (token && (route === "#/login" || route === "#/")) {
    window.location.hash = "#/dashboard";
    return null;
  }

  return route === "#/dashboard" ? <Dashboard /> : <Login />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
