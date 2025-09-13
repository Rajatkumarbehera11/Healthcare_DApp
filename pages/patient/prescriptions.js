import React, { useState, useEffect } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import { uploadFileToIPFS } from "../../utils/ipfs";

const PatientPrescriptions = () => {
  const { address, isConnected } = useAccount();
  const {
    patientData,
    refetchPatient,
    userRole,
    isLoadingRole,
    getPatientPrescriptions
  } = useHealthcareContract();

  console.log('PatientPrescriptions - userRole:', userRole);
  console.log('PatientPrescriptions - isLoadingRole:', isLoadingRole);
  console.log('PatientPrescriptions - isConnected:', isConnected);
  console.log('PatientPrescriptions - address:', address);
  console.log('PatientPrescriptions - patientData:', patientData);

  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [refillRequests, setRefillRequests] = useState(() => {
    // Load refill requests from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prescriptionRefillRequests');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [notifications, setNotifications] = useState([]);
  const [previousPrescriptionCount, setPreviousPrescriptionCount] = useState(0);
  const [notificationEnabled, setNotificationEnabled] = useState(() => {
    // Load notification preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prescriptionNotificationsEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  useEffect(() => {
    if (isConnected && address && (userRole === 'patient' || userRole === null) && !patientData) {
      refetchPatient();
    }
  }, [isConnected, address, patientData, refetchPatient, userRole]);

  const fetchPrescriptions = async (showLoading = true) => {
    if (!patientData || !address) return;

    if (showLoading) {
      setIsLoadingPrescriptions(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const prescriptionsData = await getPatientPrescriptions(address);
      setPrescriptions(prescriptionsData || []);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      if (showLoading) {
        toast.error("Failed to load prescriptions");
      } else {
        toast.error("Failed to refresh prescriptions");
      }
      setPrescriptions([]);
    } finally {
      setIsLoadingPrescriptions(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (patientData && address) {
      fetchPrescriptions();
    }
  }, [patientData, address]);

  // Auto-refresh effect with notification for new prescriptions
  useEffect(() => {
    if (!autoRefreshEnabled || !patientData || !address) return;

    const interval = setInterval(async () => {
      await fetchPrescriptions(false);
      // Check for new prescriptions and notify
      if (notificationEnabled && prescriptions.length > previousPrescriptionCount) {
        const newCount = prescriptions.length - previousPrescriptionCount;
        setNotifications(prev => [...prev, `You have ${newCount} new prescription(s).`]);
        toast.success(`You have ${newCount} new prescription(s).`);
      }
      setPreviousPrescriptionCount(prescriptions.length);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, patientData, address, notificationEnabled, prescriptions.length, previousPrescriptionCount]);

  // Save refill requests to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('prescriptionRefillRequests', JSON.stringify(refillRequests));
    }
  }, [refillRequests]);

  const handleManualRefresh = () => {
    fetchPrescriptions(false);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return prescription.status === "active";
    if (activeTab === "completed") return prescription.status === "completed";
    return true;
  });

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
  };

  const handleRefillRequest = async (prescriptionId) => {
    try {
      // Check if refill request already exists
      if (refillRequests[prescriptionId]) {
        toast.error(`Refill request already submitted for Prescription #${prescriptionId}`);
        return;
      }

      // Create refill request object
      const refillRequest = {
        id: prescriptionId,
        requestedAt: new Date().toISOString(),
        status: 'pending', // pending, approved, rejected
        patientAddress: address,
        notes: ''
      };

      // Update local state
      setRefillRequests(prev => ({
        ...prev,
        [prescriptionId]: refillRequest
      }));

      // In a real implementation, this would call a smart contract function
      // For now, we'll simulate the request
      toast.success(`Refill request submitted for Prescription #${prescriptionId}`);
      console.log(`Refill requested for prescription ID: ${prescriptionId}`, refillRequest);

      // Simulate doctor approval after some time (for demo purposes)
      setTimeout(() => {
        setRefillRequests(prev => ({
          ...prev,
          [prescriptionId]: {
            ...prev[prescriptionId],
            status: 'approved',
            approvedAt: new Date().toISOString()
          }
        }));
        toast.success(`Refill request approved for Prescription #${prescriptionId}`);
      }, 5000); // 5 seconds for demo

    } catch (error) {
      console.error("Error requesting refill:", error);
      toast.error("Failed to request refill");
    }
  };

  const handleDownloadPrescription = async (ipfsHash) => {
    try {
      // Create the IPFS gateway URL
      const url = ipfsHash.startsWith("http") ? ipfsHash : `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      // Fetch the file from IPFS
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Create a download link and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Try to get filename from content-disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'prescription.pdf'; // default filename

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Prescription downloaded successfully!");
    } catch (error) {
      console.error("Error downloading prescription:", error);
      toast.error("Failed to download prescription. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Connect Your Wallet</h2>
          <p className="text-gray-600">You need to connect your wallet to access your prescriptions.</p>
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

  if (userRole === 'unregistered') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Required</h2>
          <p className="text-gray-600 mb-6">You need to register as a patient to access your prescriptions.</p>
          <a
            href="/patient/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Register as Patient
          </a>
        </div>
      </div>
    );
  }

  if (userRole !== 'patient' && userRole !== 'admin' && userRole !== null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be registered as a patient or admin to access this page.</p>
          <a
            href="/patient/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Register as Patient
          </a>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load your patient profile.</p>
          <button
            onClick={refetchPatient}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Prescriptions</h1>
          <p className="text-gray-600">View and manage your medication prescriptions</p>
        </div>

        {/* Real-time Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefreshEnabled}
                  onChange={toggleAutoRefresh}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoRefresh" className="ml-2 text-sm text-gray-700">
                  Auto-refresh every {refreshInterval / 1000}s
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={notificationEnabled}
                  onChange={() => {
                    const newValue = !notificationEnabled;
                    setNotificationEnabled(newValue);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('prescriptionNotificationsEnabled', JSON.stringify(newValue));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                  New prescription notifications
                </label>
              </div>
              {lastRefreshTime && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isRefreshing && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Refreshing...
                </div>
              )}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {prescriptions.filter(p => p.status === "active").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {prescriptions.filter(p => p.status === "completed").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">
                  {prescriptions.filter(p => p.status === "expired").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex space-x-1">
            {[
              { id: "all", label: "All Prescriptions", count: prescriptions.length },
              { id: "active", label: "Active", count: prescriptions.filter(p => p.status === "active").length },
              { id: "completed", label: "Completed", count: prescriptions.filter(p => p.status === "completed").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="bg-white rounded-lg shadow-md">
          {isLoadingPrescriptions ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
              <p className="text-gray-600">Your prescriptions will appear here once they are prescribed by your doctor.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => (
                <div key={prescription.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Prescription #{prescription.id}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(prescription.timestamp * 1000).toLocaleDateString()} at{" "}
                          {new Date(prescription.timestamp * 1000).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-600">Doctor ID: #{prescription.doctorId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prescription.status || "active")}`}>
                          {prescription.status || "Active"}
                        </span>
                        {refillRequests[prescription.id] && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            refillRequests[prescription.id].status === 'approved' ? 'bg-green-100 text-green-800' :
                            refillRequests[prescription.id].status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Refill {refillRequests[prescription.id].status}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewPrescription(prescription)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          View
                        </button>
                        {prescription.status === "active" && (
                          <button
                            onClick={() => handleRefillRequest(prescription.id)}
                            disabled={refillRequests[prescription.id]?.status === 'pending'}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              refillRequests[prescription.id]?.status === 'pending'
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {refillRequests[prescription.id]?.status === 'pending' ? 'Refill Pending' : 'Request Refill'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPrescription(prescription.ipfsHash)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescription Detail Modal */}
        {selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Prescription Details</h3>
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prescription ID</label>
                    <p className="text-gray-900">#{selectedPrescription.id}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <p className="text-gray-900">
                      {new Date(selectedPrescription.timestamp * 1000).toLocaleDateString()} at{" "}
                      {new Date(selectedPrescription.timestamp * 1000).toLocaleTimeString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID</label>
                    <p className="text-gray-900">#{selectedPrescription.doctorId}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                    <p className="text-gray-900">#{selectedPrescription.patientId}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex flex-col space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPrescription.status || "active")}`}>
                        {selectedPrescription.status || "Active"}
                      </span>
                      {refillRequests[selectedPrescription.id] && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          refillRequests[selectedPrescription.id].status === 'approved' ? 'bg-green-100 text-green-800' :
                          refillRequests[selectedPrescription.id].status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Refill {refillRequests[selectedPrescription.id].status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IPFS Hash</label>
                    <p className="text-sm text-gray-600 font-mono break-all">{selectedPrescription.ipfsHash}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  {selectedPrescription.status === "active" && (
                    <button
                      onClick={() => handleRefillRequest(selectedPrescription.id)}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Request Refill
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadPrescription(selectedPrescription.ipfsHash)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Download Prescription
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptions;
