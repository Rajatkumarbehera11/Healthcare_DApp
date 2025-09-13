import React, { useState, useEffect } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount, waitForTransaction } from "wagmi";
import toast from "react-hot-toast";

const PatientRegister = () => {
  const { address, isConnected } = useAccount();
  const {
    registerPatient,
    isRegisteringPatient,
    userRole,
    patientData,
    refetchPatient
  } = useHealthcareContract();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male"
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isConnected && address && userRole === 'patient' && !patientData) {
      refetchPatient();
    }
  }, [isConnected, address, userRole, patientData, refetchPatient]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.age) {
      newErrors.age = "Age is required";
    } else if (parseInt(formData.age) < 1 || parseInt(formData.age) > 150) {
      newErrors.age = "Please enter a valid age (1-150)";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const txHash = await registerPatient(formData.name.trim(), parseInt(formData.age), formData.gender);
      toast.success("Patient registration transaction submitted! Waiting for confirmation...");

      // Wait for transaction confirmation
      if (txHash) {
        const receipt = await waitForTransaction({ hash: txHash });
        if (receipt.status === 1) {
          toast.success("Patient registration confirmed! Redirecting to dashboard...");
          await refetchPatient();
          // Refetch user role by forcing update (simulate by refetchPatient and userRole effect)
          // Redirect to patient dashboard
          window.location.href = "/patient/dashboard";
        } else {
          toast.error("Transaction failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error?.message || error?.data?.message || "Unknown error occurred";
      toast.error(`Registration failed: ${errorMessage}`);
    }
  };

  // If already registered, show success message
  if (patientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-8 text-center transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Already Registered</h2>
          <p className="text-cyan-400 mb-6">You are already registered as a patient in our system.</p>
          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <p className="text-sm text-cyan-400">Name: <span className="font-medium text-white">{patientData.name}</span></p>
            <p className="text-sm text-cyan-400">Age: <span className="font-medium text-white">{patientData.age?.toString()} years</span></p>
            <p className="text-sm text-cyan-400">Gender: <span className="font-medium text-white">{patientData.gender}</span></p>
          </div>
          <a
            href="/patient/dashboard"
            className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Connect Your Wallet</h2>
          <p className="text-cyan-400">You need to connect your wallet to register as a patient.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <div className="max-w-md mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Patient Registration</h1>
          <p className="text-cyan-400">Join our healthcare platform to access medical services</p>
        </div>

        {/* Registration Form */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-[0_0_15px_rgba(14,203,129,0.7)] p-8 transition-shadow duration-500 hover:shadow-[0_0_25px_rgba(14,203,129,1)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  errors.name ? 'border-red-400' : 'border-gray-600'
                }`}
                placeholder="Enter your full name"
                disabled={isRegisteringPatient}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Age Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Age <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="150"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  errors.age ? 'border-red-400' : 'border-gray-600'
                }`}
                placeholder="Enter your age"
                disabled={isRegisteringPatient}
              />
              {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
            </div>

            {/* Gender Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Gender <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  errors.gender ? 'border-red-400' : 'border-gray-600'
                }`}
                disabled={isRegisteringPatient}
              >
                <option value="Male" className="bg-gray-700 text-white">Male</option>
                <option value="Female" className="bg-gray-700 text-white">Female</option>
                <option value="Other" className="bg-gray-700 text-white">Other</option>
                <option value="Prefer not to say" className="bg-gray-700 text-white">Prefer not to say</option>
              </select>
              {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isRegisteringPatient}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegisteringPatient ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Registering...
                </div>
              ) : (
                "Register as Patient"
              )}
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-gray-700 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-cyan-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">What happens next?</h4>
                <p className="text-sm text-cyan-400">
                  After registration, you'll be able to book appointments with doctors, view your medical records,
                  and manage your prescriptions through our secure blockchain platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-cyan-400">
            Already registered?{" "}
            <a href="/patient/dashboard" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Go to Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientRegister;
