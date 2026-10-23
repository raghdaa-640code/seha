function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestGet({ request, env }) {
  const incomingUrl = new URL(request.url);
  const patientId = incomingUrl.searchParams.get("PatientId") || "";
  const serviceCode = incomingUrl.searchParams.get("NormalizedServiceCode") || "";

  if (!/^\d{10}$/.test(patientId)) {
    return jsonResponse({ ok: false, message: "رقم الهوية يجب أن يتكون من 10 أرقام" }, 422);
  }
  if (!serviceCode || serviceCode.length > 50) {
    return jsonResponse({ ok: false, message: "رقم الإجازة مطلوب" }, 422);
  }

  const baseUrl = (env.SEHA_WORKER_URL || "").replace(/\/+$/, "");
  const secret = env.SEHA_API_SECRET || "";
  if (!baseUrl || !secret) {
    console.error("Seha Worker configuration is missing");
    return jsonResponse({ ok: false, message: "Service temporarily unavailable" }, 503);
  }

  const workerUrl = new URL(`${baseUrl}/api/inquiries/sick-leave-details`);
  workerUrl.searchParams.set("PatientId", patientId);
  workerUrl.searchParams.set("NormalizedServiceCode", serviceCode);

  try {
    const response = await fetch(workerUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${secret}`,
      },
    });

    if (!response.ok) {
      console.warn("Seha Worker inquiry failed with status", response.status);
      return jsonResponse({ ok: false, message: "Service temporarily unavailable" }, 503);
    }

    const result = await response.json();
    if (!result || typeof result !== "object" || !("data" in result)) {
      console.error("Invalid response from Seha Worker");
      return jsonResponse({ ok: false, message: "Service temporarily unavailable" }, 502);
    }

    if (result.data === null) {
      return jsonResponse({ ok: true, data: null });
    }
    if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) {
      console.error("Unexpected data format from Seha Worker");
      return jsonResponse({ ok: false, message: "Service temporarily unavailable" }, 502);
    }

    const row = result.data;
    const rawDays = row.leave_duration_days;
    const days = rawDays === null || rawDays === undefined || rawDays === ""
      ? null
      : Number(rawDays);

    return jsonResponse({
      ok: true,
      data: {
        service_code: row.service_code ?? null,
        report_type: row.report_type ?? null,
        admission_date: row.admission_date ?? null,
        discharge_date: row.discharge_date ?? null,
        leave_duration_days: Number.isFinite(days) ? days : null,
        issue_date: row.issue_date ?? null,
        report_time: row.report_time ?? null,
        national_id: row.national_id ?? null,
        patient_name_ar: row.patient_name_ar ?? null,
        patient_name_en: row.patient_name_en ?? null,
        nationality: row.nationality ?? null,
        employer: row.employer ?? null,
        practitioner_name_ar: row.practitioner_name_ar ?? null,
        practitioner_name_en: row.practitioner_name_en ?? null,
        job_title_ar: row.job_title_ar ?? null,
        job_title_en: row.job_title_en ?? null,
        hospital_name_ar: row.hospital_name_ar ?? null,
        hospital_name_en: row.hospital_name_en ?? null,
        hospital_type: row.hospital_type ?? null,
        hospital_logo_path: row.logo_url ?? null,
      },
    });
  } catch (error) {
    console.error("Seha Worker request failed:", error?.name || "Error");
    return jsonResponse({ ok: false, message: "Service temporarily unavailable" }, 503);
  }
}
