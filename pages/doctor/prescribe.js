import React, { useState, useEffect } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

const DoctorPrescribe = () => {
  const { address, isConnected } = useAccount();
  const {
    doctorData,
    refetchDoctor,
    userRole,
    isLoadingRole,
    getDoctorAppointments,
    addPrescription
  } = useHealthcareContract();

  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState({
    ipfsHash: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    if (isConnected && address && !doctorData && userRole === 'doctor') {
      refetchDoctor();
    }
  }, [isConnected, address, doctorData, refetchDoctor, userRole]);

  const fetchAppointments = async (showLoading = true) => {
    if (!doctorData || !address) return;

    if (showLoading) {
      // For initial load, we don't have a separate loading state for appointments
      // The page loading is handled by doctorData loading
    } else {
      setIsRefreshing(true);
    }

    try {
      const appointmentsData = await getDoctorAppointments(address);
      // Filter for completed appointments
      const completedAppointments = appointmentsData.filter(apt => apt.status === "Completed");
      setAppointments(completedAppointments || []);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error fetching appointments:", error);
      if (showLoading) {
        toast.error("Failed to load appointments");
      } else {
        toast.error("Failed to refresh appointments");
      }
      setAppointments([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (doctorData && address) {
      fetchAppointments();
    }
  }, [doctorData, address]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled || !doctorData || !address) return;

    const interval = setInterval(() => {
      fetchAppointments(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, doctorData, address]);

  const handleManualRefresh = () => {
    fetchAppointments(false);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  const handleSelectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionData({
      ipfsHash: "",
      notes: ""
    });
  };

  const handleInputChange = (field, value) => {
    setPrescriptionData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAppointment) {
      toast.error("Please select an appointment");
      return;
    }

    if (!prescriptionData.ipfsHash.trim()) {
      toast.error("Please provide the prescription IPFS hash");
      return;
    }

    setIsSubmitting(true);
    try {
      await addPrescription(
        selectedAppointment.patientId,
        prescriptionData.ipfsHash.trim(),
        prescriptionData.notes.trim()
      );
      toast.success("Prescription added successfully");

      // Reset form
      setSelectedAppointment(null);
      setPrescriptionData({
        ipfsHash: "",
        notes: ""
      });
    } catch (error) {
      console.error("Error adding prescription:", error);
      toast.error("Failed to add prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Connect Your Wallet</h2>
          <p className="text-gray-600">You need to connect your wallet to prescribe medicine.</p>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prescribe Medicine</h1>
          <p className="text-gray-600">Create prescriptions for your patients</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Appointments List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Completed Appointments</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoRefreshDoc"
                    checked={autoRefreshEnabled}
                    onChange={toggleAutoRefresh}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoRefreshDoc" className="ml-2 text-xs text-gray-700">
                    Auto-refresh
                  </label>
                </div>
                {isRefreshing && (
                  <div className="flex items-center text-xs text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    Refreshing...
                  </div>
                )}
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            {lastRefreshTime && (
              <p className="text-xs text-gray-500 mb-4">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            )}
            {appointments.length === 0 ? (
              <p className="text-gray-600">No completed appointments found.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <li
                    key={appointment.id}
                    className={`p-4 cursor-pointer hover:bg-gray-100 ${
                      selectedAppointment && selectedAppointment.id === appointment.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleSelectAppointment(appointment)}
                  >
                    <p className="font-semibold text-gray-900">Appointment #{appointment.id}</p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(appointment.timestamp * 1000).toLocaleDateString()} at{" "}
                      {new Date(appointment.timestamp * 1000).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">Patient ID: #{appointment.patientId}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Prescription Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedAppointment ? `Prescription for Appointment #${selectedAppointment.id}` : "Select an Appointment"}
            </h2>

            {selectedAppointment ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prescription IPFS Hash *
                  </label>
                  <input
                    type="text"
                    value={prescriptionData.ipfsHash}
                    onChange={(e) => handleInputChange("ipfsHash", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter IPFS hash of prescription document"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your prescription document to IPFS and enter the hash here
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={prescriptionData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes or instructions"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Prescription...
                    </div>
                  ) : (
                    "Create Prescription"
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Appointment</h3>
                <p className="text-gray-600">Choose a completed appointment to create a prescription</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescribe;
