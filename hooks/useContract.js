import {
  useWriteContract,
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
  usePublicClient,
  useChainId,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";
import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export function useHealthcareContract() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  // MOCK: For testing, simulate wallet connection and admin address
  const mockAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // same as CONTRACT_ADDRESS owner for testing
  const isMockConnected = true;

  // State for managing user role and data
  const [userRole, setUserRole] = useState(null); // 'patient', 'doctor', 'admin', or null
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [roleUpdateTrigger, setRoleUpdateTrigger] = useState(0);

  // Determine user role based on contract data
  useEffect(() => {
    if (!address || !isConnected) {
      setUserRole(null);
      console.log('User disconnected or no address');
      return;
    }

    if (!publicClient) {
      setUserRole('unregistered');
      setIsLoadingRole(false);
      console.log('No public client available');
      return;
    }

    const determineUserRole = async () => {
      setIsLoadingRole(true);
      try {
        // Clear previous role to force update
        setUserRole(null);
        console.log('Determining user role for address:', address);

        // Check if user is owner (admin)
        try {
          const owner = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "owner",
          });
          console.log('Contract owner:', owner);
          console.log('Connected address:', address);
          console.log('Owner comparison:', owner.toLowerCase() === address.toLowerCase());

          if (owner.toLowerCase() === address.toLowerCase()) {
            setUserRole('admin');
            setIsLoadingRole(false);
            console.log('User role set to admin');
            return;
          }
        } catch (error) {
          console.error('Error reading owner from contract:', error);
        }

        // Check if user is a doctor
        try {
          const doctorData = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getDoctorByAddress",
            args: [address],
          });
          console.log('Doctor data:', doctorData);
          if (doctorData && doctorData.exists) {
            setUserRole('doctor');
            setIsLoadingRole(false);
            console.log('User role set to doctor');
            return;
          }
        } catch (error) {
          console.log('Doctor not found, continue checking');
        }

        // Check if user is a patient
        try {
          const patientData = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getPatientByAddress",
            args: [address],
          });
          console.log('Patient data:', patientData);
          if (patientData && patientData.exists) {
            setUserRole('patient');
            setIsLoadingRole(false);
            console.log('User role set to patient');
            return;
          }
        } catch (error) {
          console.log('Patient not found');
        }

        // User is not registered
        setUserRole('unregistered');
        console.log('User role set to unregistered');
      } catch (error) {
        console.error('Error determining user role:', error);
        setUserRole('error');
      } finally {
        setIsLoadingRole(false);
      }
    };

    determineUserRole();
  }, [address, isConnected, publicClient, roleUpdateTrigger]);

  // ===== PATIENT FUNCTIONS =====

  // Register patient
  const {
    writeContractAsync: registerPatientAsync,
    isPending: isRegisteringPatient,
    error: registerPatientError,
  } = useWriteContract();

  const registerPatient = useCallback(async (name, age, gender) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const hash = await registerPatientAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registerPatient",
        args: [name, parseInt(age), gender],
      });

      toast.success("Patient registration transaction submitted!");
      return hash;
    } catch (error) {
      console.error("Patient registration error:", error);
      toast.error("Failed to register patient");
      throw error;
    }
  }, [registerPatientAsync, address]);

  // Get patient data
  const { data: patientData, refetch: refetchPatient } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientByAddress",
    args: [address],
    enabled: !!address && userRole === 'patient',
  });

  // ===== DOCTOR FUNCTIONS =====

  // Register doctor (admin only)
  const {
    writeContractAsync: registerDoctorAsync,
    isPending: isRegisteringDoctor,
    error: registerDoctorError,
  } = useWriteContract();

  const registerDoctor = useCallback(async (name, specialization, doctorAddress) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const hash = await registerDoctorAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registerDoctor",
        args: [name, specialization, doctorAddress],
      });

      toast.success("Doctor registration transaction submitted!");
      return hash;
    } catch (error) {
      console.error("Doctor registration error:", error);
      toast.error("Failed to register doctor");
      throw error;
    }
  }, [registerDoctorAsync, address]);

  // Get doctor data
  const { data: doctorData, refetch: refetchDoctor } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDoctorByAddress",
    args: [address],
    enabled: !!address && userRole === 'doctor',
  });

  // ===== APPOINTMENT FUNCTIONS =====

  // Book appointment
  const {
    writeContractAsync: bookAppointmentAsync,
    isPending: isBookingAppointment,
    error: bookAppointmentError,
  } = useWriteContract();

  const bookAppointment = useCallback(async (doctorId, timestamp) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const hash = await bookAppointmentAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "bookAppointment",
        args: [parseInt(doctorId), parseInt(timestamp)],
      });

      toast.success("Appointment booking transaction submitted!");
      return hash;
    } catch (error) {
      console.error("Appointment booking error:", error);
      toast.error("Failed to book appointment");
      throw error;
    }
  }, [bookAppointmentAsync, address]);

  // Update appointment status
  const {
    writeContractAsync: updateAppointmentStatusAsync,
    isPending: isUpdatingAppointment,
    error: updateAppointmentError,
  } = useWriteContract();

  const updateAppointmentStatus = useCallback(async (appointmentId, status) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const hash = await updateAppointmentStatusAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "updateAppointmentStatus",
        args: [parseInt(appointmentId), status],
      });

      toast.success("Appointment status update transaction submitted!");
      return hash;
    } catch (error) {
      console.error("Appointment status update error:", error);
      toast.error("Failed to update appointment status");
      throw error;
    }
  }, [updateAppointmentStatusAsync, address]);

  // ===== MEDICAL RECORD FUNCTIONS =====

  // Add medical record
  const {
    writeContractAsync: addMedicalRecordAsync,
    isPending: isAddingMedicalRecord,
    error: addMedicalRecordError,
  } = useWriteContract();

  const addMedicalRecord = useCallback(async (patientId, ipfsHash) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const hash = await addMedicalRecordAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "addMedicalRecord",
        args: [parseInt(patientId), ipfsHash],
      });

      toast.success("Medical record added successfully!");
      return hash;
    } catch (error) {
      console.error("Add medical record error:", error);
      toast.error("Failed to add medical record");
      throw error;
    }
  }, [addMedicalRecordAsync, address]);

  // ===== PRESCRIPTION FUNCTIONS =====

  // Add prescription
  const {
    writeContractAsync: addPrescriptionAsync,
    isPending: isAddingPrescription,
    error: addPrescriptionError,
  } = useWriteContract();

  const addPrescription = useCallback(async (patientId, ipfsHash) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const hash = await addPrescriptionAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "addPrescription",
        args: [parseInt(patientId), ipfsHash],
      });

      toast.success("Prescription added successfully!");
      return hash;
    } catch (error) {
      console.error("Add prescription error:", error);
      toast.error("Failed to add prescription");
      throw error;
    }
  }, [addPrescriptionAsync, address]);

  // ===== DATA FETCHING HOOKS =====

  // Get all doctors (for appointment booking)
  const { data: allDoctors, refetch: refetchDoctors } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "doctors",
    args: [], // This would need to be implemented differently as we can't fetch all doctors easily
    enabled: false, // Disabled for now, will implement pagination later
  });

  // Get specific doctor by ID
  const getDoctorById = useCallback(async (doctorId) => {
    if (!publicClient) return null;
    try {
      const doctor = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "doctors",
        args: [parseInt(doctorId)],
      });
      return doctor;
    } catch (error) {
      console.error("Error fetching doctor:", error);
      return null;
    }
  }, [publicClient]);

  // Get specific patient by ID
  const getPatientById = useCallback(async (patientId) => {
    if (!publicClient) return null;
    try {
      const patient = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "patients",
        args: [parseInt(patientId)],
      });
      return patient;
    } catch (error) {
      console.error("Error fetching patient:", error);
      return null;
    }
  }, [publicClient]);

  // Get specific appointment by ID
  const getAppointmentById = useCallback(async (appointmentId) => {
    if (!publicClient) return null;
    try {
      const appointment = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "appointments",
        args: [parseInt(appointmentId)],
      });
      return appointment;
    } catch (error) {
      console.error("Error fetching appointment:", error);
      return null;
    }
  }, [publicClient]);

  // Get specific medical record by ID
  const getMedicalRecordById = useCallback(async (recordId) => {
    if (!publicClient) return null;
    try {
      const record = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "medicalRecords",
        args: [parseInt(recordId)],
      });
      return record;
    } catch (error) {
      console.error("Error fetching medical record:", error);
      return null;
    }
  }, [publicClient]);

  // Get specific prescription by ID
  const getPrescriptionById = useCallback(async (prescriptionId) => {
    if (!publicClient) return null;
    try {
      const prescription = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "prescriptions",
        args: [parseInt(prescriptionId)],
      });
      return prescription;
    } catch (error) {
      console.error("Error fetching prescription:", error);
      return null;
    }
  }, [publicClient]);

  // ===== NEW FUNCTIONS FOR FETCHING COLLECTIONS =====

  // Get all medical records for a patient
  const getPatientMedicalRecords = useCallback(async (patientAddress) => {
    if (!publicClient) return [];
    try {
      const records = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getPatientMedicalRecords",
        args: [patientAddress],
      });
      return records;
    } catch (error) {
      console.error("Error fetching patient medical records:", error);
      return [];
    }
  }, [publicClient]);

  // Get all prescriptions for a patient
  const getPatientPrescriptions = useCallback(async (patientAddress) => {
    if (!publicClient) return [];
    try {
      const prescriptions = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getPatientPrescriptions",
        args: [patientAddress],
      });
      return prescriptions;
    } catch (error) {
      console.error("Error fetching patient prescriptions:", error);
      return [];
    }
  }, [publicClient]);

  // Get all appointments for a patient
  const getPatientAppointments = useCallback(async (patientAddress) => {
    if (!publicClient) return [];
    try {
      const appointments = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getPatientAppointments",
        args: [patientAddress],
      });
      return appointments;
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
      return [];
    }
  }, [publicClient]);

  // Get all appointments for a doctor
  const getDoctorAppointments = useCallback(async (doctorAddress) => {
    if (!publicClient) return [];
    try {
      const appointments = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getDoctorAppointments",
        args: [doctorAddress],
      });
      return appointments;
    } catch (error) {
      console.error("Error fetching doctor appointments:", error);
      return [];
    }
  }, [publicClient]);

  // ===== ADMIN DASHBOARD FUNCTIONS =====

  // Get total counts for admin dashboard
  const getTotalCounts = useCallback(async () => {
    if (!publicClient) return {
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      totalMedicalRecords: 0,
      totalPrescriptions: 0,
    };
    try {
      const counts = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getTotalCounts",
      });
      return {
        totalPatients: Number(counts[0]),
        totalDoctors: Number(counts[1]),
        totalAppointments: Number(counts[2]),
        totalMedicalRecords: Number(counts[3]),
        totalPrescriptions: Number(counts[4]),
      };
    } catch (error) {
      console.error("Error fetching total counts:", error);
      return {
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        totalMedicalRecords: 0,
        totalPrescriptions: 0,
      };
    }
  }, [publicClient]);

  // Get all patients for admin
  const getAllPatients = useCallback(async () => {
    try {
      const patients = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getAllPatients",
      });
      return patients;
    } catch (error) {
      console.error("Error fetching all patients:", error);
      return [];
    }
  }, [publicClient]);

  // Get all doctors for admin
  const getAllDoctors = useCallback(async () => {
    if (!publicClient) return [];
    try {
      const doctors = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getAllDoctors",
      });
      return doctors;
    } catch (error) {
      console.error("Error fetching all doctors:", error);
      return [];
    }
  }, [publicClient]);

  // Get all appointments for admin
  const getAllAppointments = useCallback(async () => {
    try {
      const appointments = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getAllAppointments",
      });
      return appointments;
    } catch (error) {
      console.error("Error fetching all appointments:", error);
      return [];
    }
  }, [publicClient]);

  // ===== EVENT LISTENERS FOR REAL-TIME UPDATES =====

  // Listen to DoctorRegistered event and update role automatically
  useEffect(() => {
    if (!publicClient || !address) return;

    const unwatchDoctor = publicClient.watchContractEvent(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName: "DoctorRegistered",
      },
      (event) => {
        // Check if the registered doctor address matches the current user
        if (event.args.doctorAddress.toLowerCase() === address.toLowerCase()) {
          console.log('DoctorRegistered event detected for current user, updating role');
          setUserRole('doctor');
          setIsLoadingRole(false);
        }
      }
    );

    const unwatchPatient = publicClient.watchContractEvent(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName: "PatientRegistered",
      },
      (event) => {
        // Check if the registered patient address matches the current user
        if (event.args.patientAddress.toLowerCase() === address.toLowerCase()) {
          console.log('PatientRegistered event detected for current user, updating role');
          setUserRole('patient');
          setIsLoadingRole(false);
        }
      }
    );

    return () => {
      unwatchDoctor();
      unwatchPatient();
    };
  }, [publicClient, address]);

  // Listen to DoctorRegistered event (for external use)
  const listenToDoctorRegistered = useCallback((callback) => {
    if (!publicClient) return;

    const filter = {
      address: CONTRACT_ADDRESS,
      topics: [
        // keccak256 hash of DoctorRegistered(uint256,address,string,string)
        "0x" + "d0e3e7a1a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3",
      ],
    };

    publicClient.watchContractEvent(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName: "DoctorRegistered",
      },
      (event) => {
        callback(event);
      }
    );
  }, [publicClient]);

  // Listen to AppointmentBooked event
  const listenToAppointmentBooked = useCallback((callback) => {
    if (!publicClient) return;

    publicClient.watchContractEvent(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName: "AppointmentBooked",
      },
      (event) => {
        callback(event);
      }
    );
  }, [publicClient]);

  // Listen to AppointmentStatusUpdated event
  const listenToAppointmentStatusUpdated = useCallback((callback) => {
    if (!publicClient) return;

    publicClient.watchContractEvent(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        eventName: "AppointmentStatusUpdated",
      },
      (event) => {
        callback(event);
      }
    );
  }, [publicClient]);

  const refetchUserRole = useCallback(() => {
    setRoleUpdateTrigger(prev => prev + 1);
  }, []);

  return {
    // User state
    address,
    isConnected,
    userRole,
    isLoadingRole,
    refetchUserRole,

    // Patient functions
    registerPatient,
    isRegisteringPatient,
    registerPatientError,
    patientData,
    refetchPatient,

    // Doctor functions
    registerDoctor,
    isRegisteringDoctor,
    registerDoctorError,
    doctorData,
    refetchDoctor,

    // Appointment functions
    bookAppointment,
    isBookingAppointment,
    bookAppointmentError,
    updateAppointmentStatus,
    isUpdatingAppointment,
    updateAppointmentError,

    // Medical record functions
    addMedicalRecord,
    isAddingMedicalRecord,
    addMedicalRecordError,

    // Prescription functions
    addPrescription,
    isAddingPrescription,
    addPrescriptionError,

    // Data fetching utilities
    getDoctorById,
    getPatientById,
    getAppointmentById,
    getMedicalRecordById,
    getPrescriptionById,
    refetchDoctors,

    // New collection fetching functions
    getPatientMedicalRecords,
    getPatientPrescriptions,
    getPatientAppointments,
    getDoctorAppointments,

    // Admin dashboard functions
    getTotalCounts,
    getAllPatients,
    getAllDoctors,
    getAllAppointments,

    // Event listeners for real-time updates
    listenToDoctorRegistered,
    listenToAppointmentBooked,
    listenToAppointmentStatusUpdated,
  };
}
