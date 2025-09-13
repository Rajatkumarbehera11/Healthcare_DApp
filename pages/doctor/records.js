import React, { useState, useEffect } from "react";
import { useHealthcareContract } from "../../hooks/useContract";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

const DoctorRecords = () => {
  const { address, isConnected } = useAccount();
  const {
    doctorData,
    refetchDoctor,
    userRole,
    isLoadingRole,
    getDoctorAppointments,
    getPatientMedicalRecords
  } = useHealthcareContract();

  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address && !doctorData && userRole === 'doctor') {
      refetchDoctor();
    }
  }, [isConnected, address, doctorData, refetchDoctor, userRole]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!doctorData || !address) return;

      try {
        const appointmentsData = await getDoctorAppointments(address);
        setAppointments(appointmentsData || []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments");
      }
    };

    if (doctorData && address) {
      fetchAppointments();
    }
  }, [doctorData, address, getDoctorAppointments]);

  const handleSelectAppointment = async (appointment) => {
    setSelectedAppointment(appointment);
    setIsLoading(true);
    try {
      const records = await getPatientMedicalRecords(appointment.patientId);
      setMedicalRecords(records || []);
    } catch (error) {
      console.error("Error fetching medical records:", error);
      toast.error("Failed to load medical records");
      setMedicalRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Connect Your Wallet</h2>
          <p className="text-gray-600">You need to connect your wallet to access medical records.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Medical Records</h1>
          <p className="text-gray-600">View and manage medical records for your patients</p>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointments</h2>
          {appointments.length === 0 ? (
            <p className="text-gray-600">No appointments found.</p>
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
                  <p className="text-sm text-gray-600">Status: {appointment.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Medical Records List */}
        {selectedAppointment && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Medical Records for Appointment #{selectedAppointment.id}
            </h2>
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading medical records...</p>
              </div>
            ) : medicalRecords.length === 0 ? (
              <p className="text-gray-600">No medical records found for this appointment.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {medicalRecords.map((record) => (
                  <li key={record.id} className="p-4">
                    <p className="font-semibold text-gray-900">Record #{record.id}</p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(record.timestamp * 1000).toLocaleDateString()} at{" "}
                      {new Date(record.timestamp * 1000).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600 break-all">IPFS Hash: {record.ipfsHash}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorRecords;
