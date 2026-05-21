"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/lib/toast";
import { Loader2, UserPlus, KeyRound, Save, Eye, EyeOff, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MasterSettingsPage() {
  const [profileForm, setProfileForm] = useState({ username: "", email: "", password: "" });
  const [newAdminForm, setNewAdminForm] = useState({ firstName: "", lastName: "", mobile: "", email: "", username: "", password: "" });
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState({});


  // New Master Admin Email verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const fetchData = async () => {
    try {
      const [meRes, teamRes] = await Promise.all([
        api.get("/master/me"),
        api.get("/master/credentials/list")
      ]);
      const me = meRes.data.master;
      setProfileForm({ username: me.username, email: me.email, password: "" });
      setTeam(teamRes.data.masters || []);
    } catch {
      toast.error("Failed to load settings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = { username: profileForm.username, email: profileForm.email };
      if (profileForm.password) payload.password = profileForm.password;
      await api.put("/master/profile", payload);
      toast.success("Profile updated successfully");
      setProfileForm({ ...profileForm, password: "" }); // clear password field
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const sendEmailVerificationOtp = async () => {
    const email = newAdminForm.email;
    if (!email) {
      toast.error("Please enter an email address first");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await api.post("/admin/send-email-otp", { email });
      if (res.data?.success) {
        setOtpSent(true);
        toast.success("Verification code sent successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyEmailVerificationOtp = async () => {
    const email = newAdminForm.email;
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await api.post("/admin/verify-email-otp", { email, otp: otpCode });
      if (res.data?.success) {
        setEmailVerified(true);
        toast.success("Email verified successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP code");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!emailVerified) {
      toast.error("Please verify the email address using OTP first");
      return;
    }
    setCreatingAdmin(true);
    try {
      await api.post("/master/credentials", newAdminForm);
      toast.success("New Master Admin created and welcome notification sent!");
      setNewAdminForm({ firstName: "", lastName: "", mobile: "", email: "", username: "", password: "" });
      setEmailVerified(false);
      setOtpSent(false);
      setOtpCode("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create master admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="h-8 w-8 text-purple-500" /> Credentials &amp; Profile
        </h1>
        <p className="text-slate-500 mt-1">Manage your own master credentials and create sub-master accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Update */}
        <Card className="shadow-lg border-none bg-white dark:bg-slate-950">
          <CardHeader className="border-b dark:border-slate-800">
            <CardTitle className="text-lg">Update My Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Username</label>
                <input required value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-900 rounded-lg px-3 mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
                <input type="email" required value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-900 rounded-lg px-3 mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">New Password (Optional)</label>
                <input type="password" placeholder="Leave blank to keep current" value={profileForm.password} onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-900 rounded-lg px-3 mt-1" />
              </div>
              <Button type="submit" disabled={savingProfile} className="bg-purple-600 hover:bg-purple-700 w-full text-white">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create Master Admin */}
        <Card className="shadow-lg border-none bg-purple-50 dark:bg-purple-900/10">
          <CardHeader className="border-b border-purple-100 dark:border-purple-900/30">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <UserPlus className="h-5 w-5" /> Create New Master Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">First Name</label>
                  <input required value={newAdminForm.firstName} onChange={(e) => setNewAdminForm({ ...newAdminForm, firstName: e.target.value })} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Last Name</label>
                  <input required value={newAdminForm.lastName} onChange={(e) => setNewAdminForm({ ...newAdminForm, lastName: e.target.value })} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3 mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Mobile</label>
                  <input required value={newAdminForm.mobile} onChange={(e) => setNewAdminForm({ ...newAdminForm, mobile: e.target.value })} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Email</label>
                  <div className="flex gap-2 mt-1">
                    <input type="email" disabled={emailVerified} required value={newAdminForm.email} onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })} className="flex-1 h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3 disabled:opacity-60" />
                    {!emailVerified && (
                      <button
                        type="button"
                        disabled={sendingOtp}
                        onClick={sendEmailVerificationOtp}
                        className="h-10 px-3 text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        {sendingOtp && <Loader2 className="h-3 w-3 animate-spin" />}
                        {otpSent ? "Resend" : "Send OTP"}
                      </button>
                    )}
                  </div>
                  {emailVerified && (
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-extrabold mt-1">
                      ✓ Email successfully verified!
                    </p>
                  )}
                </div>
              </div>

              {otpSent && !emailVerified && (
                <div className="p-4 bg-purple-100/30 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/50 rounded-xl space-y-2.5 animate-scale-up">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">Enter 6-Digit OTP</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-10 tracking-[0.5em] text-center font-black border dark:border-slate-800 dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                    />
                    <button
                      type="button"
                      disabled={verifyingOtp}
                      onClick={verifyEmailVerificationOtp}
                      className="h-10 px-4 text-xs font-extrabold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      {verifyingOtp && <Loader2 className="h-3 w-3 animate-spin" />}
                      Verify
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    We sent a secure validation code to your email. Please enter it above.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Username</label>
                  <input required value={newAdminForm.username} onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3 mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Password</label>
                  <input required type="text" value={newAdminForm.password} onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })} className="w-full h-10 border dark:border-slate-800 dark:bg-slate-950 rounded-lg px-3 mt-1" />
                </div>
              </div>
              <div className="pt-2 space-y-2">
                <Button type="submit" disabled={creatingAdmin || !emailVerified} className="bg-purple-600 hover:bg-purple-700 w-full text-white">
                  {creatingAdmin ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />} Create Account
                </Button>
                {!emailVerified && (
                  <p className="text-[10.5px] text-center text-amber-600 dark:text-amber-400 font-extrabold">
                    ⚠️ Verify the new master admin email with OTP to unlock creation
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      <Card className="shadow-lg border-none bg-white dark:bg-slate-950">
        <CardHeader className="border-b dark:border-slate-800">
          <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-slate-500" /> Master Admin Team</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Password</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {team.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-bold">{m.firstName} {m.lastName}</td>
                    <td className="px-6 py-4">
                      <p>{m.email}</p>
                      <p className="text-xs text-slate-500">{m.mobile}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-xs">{m.username}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                          {showPassword[m._id] ? m.key || "Hidden" : "••••••••"}
                        </span>
                        <button onClick={() => togglePasswordVisibility(m._id)} className="text-slate-400 hover:text-purple-500">
                          {showPassword[m._id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
