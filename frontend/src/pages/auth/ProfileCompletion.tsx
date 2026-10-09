import { useState, useEffect, type ChangeEvent, type JSX } from "react";
import { Camera, MapPin, User, Calendar } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { authFetch, authGet } from "../../lib/api";
import { useToast } from "../../lib/toast";

interface FormData {
  age: string;
  gender: string;
  bio: string;
  city: string;
}

export default function ProfileCompletion(): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    age: "",
    gender: "",
    bio: "",
    city: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!user) {
      toast.error("User not found. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Identity comes from the Clerk JWT — no clerkId in body
      const response = await authFetch(getToken, "/api/info", {
        method: "POST",
        body: JSON.stringify({
          age: Number(formData.age),
          gender: formData.gender,
          city: formData.city,
          bio: formData.bio,
        }),
      });

      if (response.ok) {
        toast.success("Profile saved successfully!");
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        toast.error(`Failed to save profile: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast.error("A network or server error occurred!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🧠 Check if the user already has a profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;

      try {
        await authGet(getToken, `/api/info/${user.id}`);
        navigate("/dashboard");
      } catch {
        // No profile yet — stay on completion page
      }
    };

    checkExistingProfile();
  }, [user, getToken, navigate]);

  // 📸 Handle Clerk profile image upload
  const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingImage(true);
      await user.setProfileImage({ file });
      await user.reload(); // Refresh to get new image URL
      toast.success("Profile picture updated!");
    } catch (err) {
      console.error("Failed to upload profile image:", err);
      toast.error("Error uploading profile picture!");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-500">
            Just a few more details to get you started
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-lg rounded-xl p-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-300 to-pink-400 flex items-center justify-center overflow-hidden">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>

              {/* Upload button */}
              <label
                htmlFor="profile-upload"
                className={`absolute bottom-0 right-0 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 p-3 rounded-full cursor-pointer shadow-lg transition-all ${
                  isUploadingImage ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {isUploadingImage ? "Uploading..." : "Profile picture powered by Clerk"}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Age and Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-800 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2 text-pink-500" />
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  min={18}
                  max={120}
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter your age"
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-800 mb-2">
                  <User className="w-4 h-4 inline mr-2 text-pink-500" />
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-800 mb-2">
                <MapPin className="w-4 h-4 inline mr-2 text-pink-500" />
                City
              </label>
              <input
                id="city"
                type="text"
                name="city"
                maxLength={100}
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter your city"
                autoComplete="address-level2"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-800 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us a bit about yourself..."
                maxLength={1000}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length} characters
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full mt-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-[1.02] ${
              isSubmitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:from-pink-600 hover:to-purple-600"
            }`}
          >
            {isSubmitting ? "Saving..." : "Complete Profile"}
          </button>

          {/* Skip Option */}
          <button
            type="button"
            className="w-full mt-3 py-3 text-gray-500 hover:text-pink-500 font-medium transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
