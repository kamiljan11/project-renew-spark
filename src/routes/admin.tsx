import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut,
  RefreshCw,
  Search,
  Package,
  Phone,
  Mail,
  MapPin,
  Car,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
});

const STATUSES = [
  "Nowe zamówienie (Nie ruszone)",
  "W trakcie wyceny",
  "Wycena wysłana",
  "Zaakceptowane",
  "Zamówione u dostawcy",
  "W transporcie",
  "Dostarczone",
  "Anulowane",
] as const;

const STATUS_COLORS: Record<string, string> = {
  "Nowe zamówienie (Nie ruszone)": "bg-blue-100 text-blue-800",
  "W trakcie wyceny": "bg-yellow-100 text-yellow-800",
  "Wycena wysłana": "bg-purple-100 text-purple-800",
  Zaakceptowane: "bg-emerald-100 text-emerald-800",
  "Zamówione u dostawcy": "bg-indigo-100 text-indigo-800",
  "W transporcie": "bg-orange-100 text-orange-800",
  Dostarczone: "bg-green-100 text-green-800",
  Anulowane: "bg-red-100 text-red-800",
};

type Quote = {
  id: string;
  order_num: number;
  created_at: string;
  status: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  license_plate: string | null;
  part: string | null;
  part_links: string | null;
  comment: string | null;
  delivery_preference: string | null;
  photo_urls: string[] | null;
};

function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id);
      const isAdmin = roles?.some((r) => r.role === "admin");
      if (!mounted) return;
      if (!isAdmin) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      await load();
      setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const load = async () => {
    const { data } = await supabase
      .from("quotes")
      .select(
        "id,order_num,created_at,status,company,phone,email,address,license_plate,part,part_links,comment,delivery_preference,photo_urls",
      )
      .order("created_at", { ascending: false });
    setQuotes((data ?? []) as Quote[]);
  };

  const updateStatus = async (id: string, status: string) => {
    setQuotes((q) => q.map((x) => (x.id === id ? { ...x, status } : x)));
    await supabase
      .from("quotes")
      .update({ status } as never)
      .eq("id", id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return quotes.filter((q) => {
      if (filter !== "all" && q.status !== filter) return false;
      if (!s) return true;
      return [
        q.company,
        q.email,
        q.phone,
        q.part,
        q.part_links,
        q.license_plate,
        String(q.order_num),
      ].some((f) => (f ?? "").toLowerCase().includes(s));
    });
  }, [quotes, search, filter]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { all: quotes.length };
    for (const s of STATUSES) counts[s] = 0;
    for (const q of quotes) counts[q.status] = (counts[q.status] ?? 0) + 1;
    return counts;
  }, [quotes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Not authorized</h1>
          <p className="text-muted-foreground mb-4">Your account doesn't have admin access.</p>
          <button onClick={signOut} className="text-mas-orange underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-mas-orange" />
            <div>
              <h1 className="font-black text-lg" style={{ fontFamily: "Exo 2" }}>
                Admin Dashboard
              </h1>
              <p className="text-xs text-white/60">Part requests · {quotes.length} total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-white/70 hover:text-white px-3 py-2">
              View site
            </Link>
            <button onClick={load} className="p-2 rounded-lg hover:bg-white/10" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${filter === "all" ? "bg-navy text-white border-navy" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"}`}
          >
            All ({stats.all})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${filter === s ? "bg-navy text-white border-navy" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"}`}
            >
              {s} ({stats[s] ?? 0})
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, part, plate, order #…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-border bg-white text-sm outline-none focus:border-mas-orange"
          />
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Part</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-10">
                      No requests.
                    </td>
                  </tr>
                )}
                {filtered.map((q) => (
                  <Fragment key={q.id}>
                    <tr
                      className="border-t border-border hover:bg-slate-50 cursor-pointer"
                      onClick={() => setOpenId(openId === q.id ? null : q.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">#{q.order_num}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(q.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-navy">{q.company || "—"}</div>
                        <div className="text-xs text-muted-foreground">{q.email || q.phone}</div>
                      </td>
                      <td className="px-4 py-3 max-w-md truncate">
                        {q.part || q.part_links || "—"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={q.status}
                          onChange={(e) => updateStatus(q.id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded-md border-0 ${STATUS_COLORS[q.status] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {openId === q.id && (
                      <tr className="bg-slate-50 border-t border-border">
                        <td colSpan={5} className="px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <Field
                              icon={<Phone className="w-3.5 h-3.5" />}
                              label="Phone"
                              value={q.phone}
                            />
                            <Field
                              icon={<Mail className="w-3.5 h-3.5" />}
                              label="Email"
                              value={q.email}
                            />
                            <Field
                              icon={<MapPin className="w-3.5 h-3.5" />}
                              label="Address"
                              value={q.address}
                            />
                            <Field
                              icon={<Car className="w-3.5 h-3.5" />}
                              label="License plate"
                              value={q.license_plate}
                            />
                            <Field
                              icon={<Package className="w-3.5 h-3.5" />}
                              label="Delivery preference"
                              value={q.delivery_preference}
                            />
                          </div>
                          {q.part_links && (
                            <div className="mt-4">
                              <div className="text-xs font-bold text-navy mb-1">Part / link</div>
                              <div className="text-sm bg-white border border-border rounded-lg p-3 whitespace-pre-wrap break-all">
                                {q.part_links.split(/\s+/).map((token, i) =>
                                  /^https?:\/\//i.test(token) ? (
                                    <a
                                      key={i}
                                      href={token}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-mas-orange underline inline-flex items-center gap-1 mr-2"
                                    >
                                      {token} <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span key={i}>{token} </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                          {q.comment && (
                            <div className="mt-4">
                              <div className="text-xs font-bold text-navy mb-1">
                                Internal comment
                              </div>
                              <div className="text-sm bg-white border border-border rounded-lg p-3 whitespace-pre-wrap">
                                {q.comment}
                              </div>
                            </div>
                          )}
                          {!!q.photo_urls?.length && (
                            <div className="mt-4">
                              <div className="text-xs font-bold text-navy mb-2">
                                Photos ({q.photo_urls.length})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {q.photo_urls.map((url) => (
                                  <a
                                    key={url}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-24 h-24 rounded-lg overflow-hidden border border-border"
                                  >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
        {icon} {label}
      </div>
      <div className="font-medium text-navy">{value || "—"}</div>
    </div>
  );
}
