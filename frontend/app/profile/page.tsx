import AppShell from "@/components/layout/AppShell";

export default function ProfilePage() {
  return (
    <AppShell title="Profile">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-crimson to-brand-teal text-lg font-bold text-white">
            JA
          </span>
          <div>
            <p className="text-lg font-bold text-slate-800">John Admin</p>
            <p className="text-sm text-slate-400">Administrator</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
