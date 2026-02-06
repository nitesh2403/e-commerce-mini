import React, { useState, useEffect } from "react";
import api from "../api";

const Profile = () => {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    postal_code: "",
  });
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("users/profile/");
      setProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    if (
      passwords.newPassword &&
      passwords.newPassword !== passwords.confirmPassword
    ) {
      setMessage({ type: "error", text: "Passwords do not match." });
      setSaving(false);
      return;
    }

    const dataToUpdate = { ...profile };
    if (passwords.newPassword) {
      dataToUpdate.password = passwords.newPassword;
    }

    try {
      await api.patch("users/profile/", dataToUpdate);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      // Clear password fields on success
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-serif font-bold leading-7 text-white sm:text-3xl sm:truncate">
            My Profile
          </h2>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-md ${message.type === "success" ? "bg-green-900/30 text-green-400 border border-green-800" : "bg-red-900/30 text-red-400 border border-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 theme-card px-4 py-5 sm:rounded-lg sm:p-6"
      >
        {/* Personal Details */}
        <div>
          <h3 className="text-lg leading-6 font-medium text-[#D4AF37]">
            Personal Information
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-400"
              >
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={profile.username}
                  className="input-field opacity-70 cursor-not-allowed"
                  readOnly
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-400"
              >
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="phone_number"
                  id="phone_number"
                  value={profile.phone_number || ""}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Details - Only for Customers */}
        {profile.role !== "admin" && (
          <>
            <div className="hidden sm:block" aria-hidden="true">
              <div className="py-5">
                <div className="border-t border-[#333]" />
              </div>
            </div>

            <div>
              <h3 className="text-lg leading-6 font-medium text-[#D4AF37]">
                Default Shipping Address
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                This address will be pre-filled for your future orders.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-400"
                  >
                    Street Address
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={profile.address || ""}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-400"
                  >
                    City
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={profile.city || ""}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="postal_code"
                    className="block text-sm font-medium text-gray-400"
                  >
                    Postal Code
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="postal_code"
                      id="postal_code"
                      value={profile.postal_code || ""}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Security Section */}
        <div>
          <h3 className="text-lg leading-6 font-medium text-[#D4AF37]">
            Security
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Leave blank if you don't want to change your password.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-400"
              >
                New Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  className="input-field"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-400"
              >
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`ml-3 btn-primary ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
