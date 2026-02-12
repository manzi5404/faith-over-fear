const { useEffect, useMemo, useState } = React;

const BASE_URL = "http://localhost:3000";

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
        await api.patch(`/api/products/${editingId}`, payload);
        onToast("Product updated");
      } else {
        await api.post("/api/products", payload);
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
      await api.patch(`/api/products/${product._id || product.id}`, { isActive: !product.isActive });
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
  const { data, loading, error, reload } = useFetch(() => api.get("/api/collections"), []);
  const [form, setForm] = useState({ name: "", description: "", isActive: true });
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm({ name: "", description: "", isActive: true });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      isActive: !!form.isActive
    };
    try {
      if (editingId) {
        await api.patch(`/api/collections/${editingId}`, payload);
        onToast("Collection updated");
      } else {
        await api.post("/api/collections", payload);
        onToast("Collection created");
      }
      resetForm();
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save collection");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      isActive: item.isActive !== false
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/collections/${id}`);
      onToast("Collection deleted");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Delete failed");
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.patch(`/api/collections/${item._id || item.id}`, { isActive: !item.isActive });
      reload();
    } catch (err) {
      onToast("Toggle failed");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Collections / Drops</h3>
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
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
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
          {editingId ? "Update Collection" : "Add Collection"}
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
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
              <span className={`text-xs ${item.isActive ? "text-emerald-400" : "text-rose-400"}`}>
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button onClick={() => handleEdit(item)} className="rounded bg-slate-800 px-2 py-1">Edit</button>
              <button onClick={() => toggleActive(item)} className="rounded bg-slate-800 px-2 py-1">Toggle</button>
              <button onClick={() => handleDelete(item._id || item.id)} className="rounded bg-rose-600 px-2 py-1">
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
  const { data: announcements, loading, error, reload } = useFetch(() => api.get("/api/announcements"), []);
  const { data: products } = useFetch(() => api.get("/api/products"), []);
  const { data: collections } = useFetch(() => api.get("/api/collections"), []);
  const [form, setForm] = useState({
    type: "global",
    message: "",
    isActive: true,
    dismissible: true,
    drop: "",
    product: ""
  });
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm({ type: "global", message: "", isActive: true, dismissible: true, drop: "", product: "" });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      type: form.type,
      message: form.message,
      isActive: !!form.isActive,
      dismissible: !!form.dismissible,
      drop: form.type === "drop" ? form.drop : undefined,
      product: form.type === "product" ? form.product : undefined
    };
    try {
      if (editingId) {
        await api.put(`/api/announcements/${editingId}`, payload);
        onToast("Announcement updated");
      } else {
        await api.post("/api/announcements", payload);
        onToast("Announcement created");
      }
      resetForm();
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save announcement");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      type: item.type || "global",
      message: item.message || "",
      isActive: item.isActive !== false,
      dismissible: item.dismissible !== false,
      drop: item.drop || "",
      product: item.product || ""
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/announcements/${id}`);
      onToast("Announcement deleted");
      reload();
    } catch (err) {
      onToast(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Announcements</h3>
        <button onClick={resetForm} className="text-xs uppercase text-slate-300">Clear</button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <select
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={form.type}
          onChange={(event) => setForm({ ...form, type: event.target.value, drop: "", product: "" })}
        >
          <option value="global">Global</option>
          <option value="drop">Drop</option>
          <option value="product">Product</option>
        </select>
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Message"
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
        />
        {form.type === "drop" && (
          <select
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={form.drop}
            onChange={(event) => setForm({ ...form, drop: event.target.value })}
          >
            <option value="">Select collection</option>
            {(collections || []).map((item) => (
              <option key={item._id || item.id} value={item._id || item.id}>
                {item.name}
              </option>
            ))}
          </select>
        )}
        {form.type === "product" && (
          <select
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={form.product}
            onChange={(event) => setForm({ ...form, product: event.target.value })}
          >
            <option value="">Select product</option>
            {(products || []).map((item) => (
              <option key={item._id || item.id} value={item._id || item.id}>
                {item.name}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.dismissible}
            onChange={(event) => setForm({ ...form, dismissible: event.target.checked })}
          />
          Dismissible
        </label>
        <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900">
          {editingId ? "Update Announcement" : "Add Announcement"}
        </button>
      </form>
      {loading && <p className="mt-4 text-sm text-slate-400">Loading...</p>}
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(announcements || []).map((item) => (
          <div key={item._id || item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.message}</p>
                <p className="text-xs text-slate-400">{item.type}</p>
              </div>
              <span className={`text-xs ${item.isActive ? "text-emerald-400" : "text-rose-400"}`}>
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button onClick={() => handleEdit(item)} className="rounded bg-slate-800 px-2 py-1">Edit</button>
              <button onClick={() => handleDelete(item._id || item.id)} className="rounded bg-rose-600 px-2 py-1">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
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
      await api.put("/api/settings", form);
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
