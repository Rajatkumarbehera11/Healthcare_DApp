import React, { useState, useEffect } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

const DoctorProfile = () => {
  const { address, isConnected } = useAccount();
  const {
    doctorData,
    refetchDoctor,
    userRole,
    isLoadingRole
  } = useHealthcareContract();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    specialization: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isConnected && address && !doctorData && userRole === 'doctor') {
      refetchDoctor();
    }
  }, [isConnected, address, doctorData, refetchDoctor, userRole]);

  useEffect(() => {
    if (doctorData) {
      setFormData({
        name: doctorData.name || "",
        specialization: doctorData.specialization || ""
      });
    }
  }, [doctorData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = "Specialization is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Note: In a real implementation, you would need to add an updateDoctor function to the smart contract
    // For now, we'll show a message that profile updates are not yet implemented
    toast.info("Profile update functionality will be implemented in the next version");
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (doctorData) {
      setFormData({
        name: doctorData.name || "",
        specialization: doctorData.specialization || ""
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Connect Your Wallet</h2>
          <p className="text-gray-600">You need to connect your wallet to access your profile.</p>
        </div>
      </div>
    );
  }

  if (isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (userRole !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be registered as a doctor to access this page.</p>
          <a
            href="/doctor/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Register as Doctor
          </a>
        </div>
      </div>
    );
  }

  if (!doctorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load your doctor profile.</p>
          <button
            onClick={refetchDoctor}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Profile</h1>
          <p className="text-gray-600">Manage your professional information and account settings</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{doctorData.name}</h2>
                <p className="text-gray-600">{doctorData.specialization}</p>
                <p className="text-sm text-gray-500">Doctor ID: {doctorData.id}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Information */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
              ) : (
                <p className="text-lg text-gray-900">{doctorData.name}</p>
              )}
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
              {isEditing ? (
                <div>
                  <select
                    value={formData.specialization}
                    onChange={(e) => handleInputChange("specialization", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select specialization</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Emergency Medicine">Emergency Medicine</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>}
                </div>
              ) : (
                <p className="text-lg text-gray-900">{doctorData.specialization}</p>
              )}
            </div>

            {/* Wallet Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
              <p className="text-sm text-gray-600 font-mono break-all">{address}</p>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">License Number</p>
              <p className="text-lg font-semibold text-gray-900">Not available</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Years of Experience</p>
              <p className="text-lg font-semibold text-gray-900">Not available</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Hospital/Clinic</p>
              <p className="text-lg font-semibold text-gray-900">Not available</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Account Status</p>
              <p className="text-lg font-semibold text-green-600">Active</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="/doctor/appointments"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Manage Appointments</p>
                <p className="text-sm text-gray-600">View and update your appointments</p>
              </div>
            </a>

            <a
              href="/doctor/records"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Medical Records</p>
                <p className="text-sm text-gray-600">Access patient medical records</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
