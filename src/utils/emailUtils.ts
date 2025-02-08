import emailjs from "@emailjs/browser";
import supabase from "./supabase";

type EmailData = {
  patientName: string;
  patientArea: string;
  patientLocation: string;
  serviceType: string[];
  details: string;
  imageUrl?: string;
};

// Initialize EmailJS with your public key
emailjs.init("4N70KK1SQmyzd406d");

// Helper functions to identify service types
const isPhysiotherapyService = (type: string) => type === "physiotherapy";

const isPrivateService = (type: string) =>
  [
    "full_time_private_normal",
    "full_time_private_psychiatric",
    "part_time_private_normal",
    "part_time_private_psychiatric",
  ].includes(type);

const isQuickService = (type: string) =>
  ["blood_test", "im", "iv", "patient_care", "hemo_vs", "other"].includes(type);

export const sendNotificationToNurses = async (emailData: EmailData) => {
  try {
    // Get all super admins regardless of area
    const { data: superAdmins } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "superAdmin");

    // Initialize array for area-specific healthcare providers
    let areaSpecificProviders: { email: string }[] = [];

    // Determine service type from the first service (main service)
    const mainServiceType = emailData.serviceType[0];

    // Build query based on service type
    let query = supabase
      .from("profiles")
      .select("email")
      .eq("is_approved", true)
      .eq("is_blocked", false);

    if (isPhysiotherapyService(mainServiceType)) {
      // For physiotherapy services, only notify physiotherapists
      query = query.eq("role", "physiotherapist");
    } else if (
      isQuickService(mainServiceType) ||
      isPrivateService(mainServiceType)
    ) {
      // For private and quick services, notify nurses
      query = query.eq("role", "registered");
    }

    // Apply area filter
    if (emailData.patientArea === "beirut") {
      query = query.or(`area.eq.beirut,area.eq.near_beirut`);
    } else if (emailData.patientArea === "near_beirut") {
      query = query.or(`area.eq.near_beirut,area.eq.beirut`);
    } else {
      query = query.eq("area", emailData.patientArea);
    }

    const { data: providers } = await query;

    if (providers) {
      areaSpecificProviders = providers;
    }

    // Combine and deduplicate emails
    const allEmails = [
      ...(superAdmins?.map((admin) => admin.email) || []),
      ...(areaSpecificProviders.map((provider) => provider.email) || []),
    ];
    const uniqueEmails = [...new Set(allEmails)];

    if (uniqueEmails.length === 0) return;

    const templateParams = {
      to_email: uniqueEmails.join(","),
      patient_name: emailData.patientName,
      patient_area: emailData.patientArea,
      patient_location: emailData.patientLocation,
      service_type: emailData.serviceType.join(", "),
      details: emailData.details,
    };

    const response = await emailjs.send(
      "service_r6n90nk",
      "template_sbdqdmd",
      templateParams
    );

    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendNurseAssignmentRequest = async (
  requestId: string,
  nurseName: string,
  patientName: string,
  serviceType: string[]
) => {
  try {
    // Get super admin emails
    const { data: superAdmins } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "superAdmin");

    if (!superAdmins || superAdmins.length === 0) return;

    const uniqueEmails = [...new Set(superAdmins.map((admin) => admin.email))];

    const templateParams = {
      to_email: uniqueEmails.join(","),
      nurse_name: nurseName,
      patient_name: patientName,
      service_type: serviceType.join(", "),
      request_id: requestId,
    };

    const response = await emailjs.send(
      "service_r6n90nk",
      "template_rfosoa3",
      templateParams
    );

    return response;
  } catch (error) {
    console.error("Error sending nurse assignment request email:", error);
    throw error;
  }
};
